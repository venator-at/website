import { NextResponse } from "next/server";
import { buildArchitectureGeneratorPrompt } from "@/lib/ai/prompt";

interface GenerateJsonRequest {
  idea?: string;
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

    console.log("[AI ROUTE] Request received", {
      requestId,
      hasIdea: Boolean(idea),
      ideaLength: idea?.length ?? 0,
    });

    if (!idea) {
      return respond({ error: "Please provide an idea." }, 400);
    }

    // Support both key names:
    // - GOOGLE_AI_STUDIO_API_KEY (project convention)
    // - GOOGLE_API_KEY (official @google/genai docs)
    const apiKey = (
      process.env.GOOGLE_AI_STUDIO_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.GEMINI_API_KEY
    )?.trim();
    const model = process.env.GOOGLE_AI_MODEL || "gemini-3-flash-preview";

    if (!apiKey) {
      return respond(
        {
          error:
            "Missing Google AI key. On Vercel set GOOGLE_AI_STUDIO_API_KEY or GOOGLE_API_KEY (or GEMINI_API_KEY) in Environment Variables, then redeploy.",
        },
        500,
      );
    }

    const prompt = buildArchitectureGeneratorPrompt(idea);
    console.log("[AI PROMPT START]");
    console.log(prompt);
    console.log("[AI PROMPT END]");

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
            maxOutputTokens: 4096,
            topP: 0.9,
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
      });
      return respond(
        { error: `Gemini request failed (${model}): ${response.status} ${errorText}${hint}` },
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
