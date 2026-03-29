import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { buildArchitectureGeneratorPrompt } from "@/lib/ai/prompt";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FREE_CREDITS, CREDITS_PER_GENERATION } from "@/lib/firebase/credits";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/firebase/rateLimit";

interface GenerateJsonRequest {
  idea?: string;
  projectType?: string;
  experienceLevel?: string;
  budgetLevel?: string;
}

function extractJsonFromModelText(text: string): string {
  const trimmed = text.trim();

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function basicArchitectureShapeValidation(value: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "Model output root is not an object." };
  }

  const obj = value as Record<string, unknown>;

  if (!Array.isArray(obj.components) || !Array.isArray(obj.connections)) {
    return { ok: false, error: "Model output must contain components[] and connections[] arrays." };
  }

  return { ok: true };
}

async function resolveUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function ensureCredits(userId: string): Promise<{ ok: true; credits: number } | { ok: false; credits: number }> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const snap = await userRef.get();

  if (!snap.exists) {
    // Initialize user with free credits
    await userRef.set({
      credits: FREE_CREDITS,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, credits: FREE_CREDITS };
  }

  const currentCredits = (snap.data()?.credits as number) ?? 0;
  return currentCredits >= CREDITS_PER_GENERATION
    ? { ok: true, credits: currentCredits }
    : { ok: false, credits: currentCredits };
}

async function deductCredits(userId: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const current = (snap.data()?.credits as number) ?? 0;

    if (current < CREDITS_PER_GENERATION) {
      throw new Error("Insufficient credits");
    }

    t.update(userRef, {
      credits: FieldValue.increment(-CREDITS_PER_GENERATION),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  // Record usage
  const db2 = getAdminDb();
  await db2.collection("credit_transactions").add({
    userId,
    amount: -CREDITS_PER_GENERATION,
    reason: "usage",
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const respond = (body: Record<string, unknown>, status: number) => {
    const response = NextResponse.json({ ...body, requestId }, { status });
    response.headers.set("x-request-id", requestId);
    return response;
  };

  try {
    const body = (await request.json()) as GenerateJsonRequest;
    const idea = body.idea?.trim();
    const projectType = body.projectType?.trim();
    const experienceLevel = body.experienceLevel?.trim();
    const budgetLevel = body.budgetLevel?.trim();

    console.log("[AI ROUTE] Request received", {
      requestId,
      hasIdea: Boolean(idea),
      ideaLength: idea?.length ?? 0,
    });

    if (!idea) {
      return respond({ error: "Please provide an idea." }, 400);
    }

    // Input length validation
    if (idea.length > 2000) {
      return respond({ error: "Idea must be at most 2000 characters." }, 400);
    }
    if ((projectType?.length ?? 0) > 100) {
      return respond({ error: "Project type must be at most 100 characters." }, 400);
    }
    if ((experienceLevel?.length ?? 0) > 100) {
      return respond({ error: "Experience level must be at most 100 characters." }, 400);
    }
    if ((budgetLevel?.length ?? 0) > 100) {
      return respond({ error: "Budget level must be at most 100 characters." }, 400);
    }

    // Verify auth
    const userId = await resolveUserId(request);

    // Rate limit: 10 calls per minute per user/IP
    const rateLimitId = getRateLimitIdentifier(request, userId);
    const rateLimit = await checkRateLimit(rateLimitId);
    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
      const response = respond(
        { error: "Zu viele Anfragen. Bitte warte eine Minute und versuche es erneut." },
        429,
      );
      response.headers.set("Retry-After", String(retryAfterSec));
      return response;
    }

    if (userId) {
      const creditCheck = await ensureCredits(userId);
      if (!creditCheck.ok) {
        return respond(
          {
            error: "Nicht genug Credits. Bitte lade dein Guthaben auf.",
            credits: creditCheck.credits,
            required: CREDITS_PER_GENERATION,
          },
          402,
        );
      }
      // Deduct credits BEFORE generation to prevent free usage on silent failures
      await deductCredits(userId);
    }

    // Support both key names:
    // - GOOGLE_AI_STUDIO_API_KEY (project convention)
    // - GOOGLE_API_KEY (official @google/genai docs)
    const apiKey = (
      process.env.GOOGLE_AI_STUDIO_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.GEMINI_API_KEY
    )?.trim();
    const model = process.env.GOOGLE_AI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      return respond(
        {
          error:
            "Missing Google AI key. On Vercel set GOOGLE_AI_STUDIO_API_KEY or GOOGLE_API_KEY (or GEMINI_API_KEY) in Environment Variables, then redeploy.",
        },
        500,
      );
    }

    const prompt = buildArchitectureGeneratorPrompt(idea, { projectType, experienceLevel, budgetLevel });
    if (process.env.NODE_ENV === "development") {
      console.log("[AI PROMPT START]");
      console.log(prompt);
      console.log("[AI PROMPT END]");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            topP: 0.9,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      const normalizedError = errorText.toUpperCase();
      let hint = "";

      if (normalizedError.includes("API_KEY_INVALID") || normalizedError.includes("API KEY NOT FOUND")) {
        hint = " Hint: API key is invalid or not available in this Vercel environment. Re-check key value and set it for Production, then redeploy.";
      } else if (normalizedError.includes("NOT_FOUND") || normalizedError.includes("MODEL")) {
        hint = " Hint: Model name may be invalid for your account. Try GOOGLE_AI_MODEL=gemini-2.0-flash.";
      }

      console.error("[AI ROUTE] Gemini request failed", {
        requestId,
        status: response.status,
        body: errorText,
        hint,
      });
      return respond(
        { error: "KI-Anfrage fehlgeschlagen. Bitte versuche es erneut." },
        502,
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const generatedText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? "";

    if (!generatedText) {
      return respond(
        { error: "Gemini returned no text output." },
        502,
      );
    }

    const jsonText = extractJsonFromModelText(generatedText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return respond(
        {
          error: "Gemini output was not valid JSON.",
          raw: generatedText,
        },
        502,
      );
    }

    const shapeCheck = basicArchitectureShapeValidation(parsed);
    if (!shapeCheck.ok) {
      return respond(
        {
          error: shapeCheck.error,
          raw: parsed,
        },
        502,
      );
    }

    return respond(
      {
        jsonText: JSON.stringify(parsed, null, 2),
      },
      200,
    );
  } catch (error) {
    console.error("[AI ROUTE] Unexpected server error", { requestId, error });
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return respond({ error: message }, 500);
  }
}
