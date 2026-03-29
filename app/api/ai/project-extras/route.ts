import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/firebase/rateLimit";

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

interface ProjectExtrasRequest {
  prompt?: string;
  techStack?: string[];
  projectType?: string;
}

interface ExtrasResult {
  costEstimation?: { monthlyCost: string; description: string };
  setupCommands: string[];
  goLiveChecklist: string[];
}

function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch?.[1]) return codeBlockMatch[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return trimmed;
}

async function callGemini(aiPrompt: string, apiKey: string, model: string): Promise<ExtrasResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024, topP: 0.9 },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[project-extras] Gemini request failed", { status: response.status, body: errorText });
    throw new Error("KI-Anfrage fehlgeschlagen.");
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const generatedText =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!generatedText) throw new Error("Gemini returned no output.");

  const jsonText = extractJsonFromText(generatedText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Gemini output was not valid JSON.");
  }

  const obj = parsed as Record<string, unknown>;

  const costEstimation =
    typeof obj.costEstimation === "object" && obj.costEstimation !== null
      ? {
          monthlyCost: String((obj.costEstimation as Record<string, unknown>).monthlyCost ?? ""),
          description: String((obj.costEstimation as Record<string, unknown>).description ?? ""),
        }
      : undefined;

  const setupCommands = Array.isArray(obj.setupCommands)
    ? obj.setupCommands.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  const goLiveChecklist = Array.isArray(obj.goLiveChecklist)
    ? obj.goLiveChecklist.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  return { costEstimation, setupCommands, goLiveChecklist };
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Authentifizierung erforderlich." }, { status: 401 });
    }

    // Rate limit: 10 calls per minute per user
    const rateLimitId = getRateLimitIdentifier(request, userId);
    const rateLimit = await checkRateLimit(rateLimitId);
    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
      const response = NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte eine Minute und versuche es erneut." },
        { status: 429 },
      );
      response.headers.set("Retry-After", String(retryAfterSec));
      return response;
    }

    const body = (await request.json()) as ProjectExtrasRequest;
    const prompt = body.prompt?.trim();
    const techStack = Array.isArray(body.techStack) ? body.techStack : [];
    const projectType = body.projectType?.trim() ?? "";

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Prompt must be at most 2000 characters." }, { status: 400 });
    }

    const apiKey = (
      process.env.GOOGLE_AI_STUDIO_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.GEMINI_API_KEY
    )?.trim();
    const model = process.env.GOOGLE_AI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Google AI key.", userMessage: "KI-Konfiguration fehlt. Bitte kontaktiere den Support." },
        { status: 500 },
      );
    }

    const techStackLine = techStack.length > 0 ? `Tech Stack: ${techStack.join(", ")}` : "";
    const projectTypeLine = projectType ? `Project type: ${projectType}` : "";

    const aiPrompt = [
      "You are a senior software architect helping beginners plan their projects.",
      "Return ONLY valid JSON. No markdown. No explanation. No code fences.",
      "",
      "Output must be a single JSON object with exactly this shape:",
      "{",
      '  "costEstimation": {',
      '    "monthlyCost": "string (e.g. \'$0 - $20\')",',
      '    "description": "string (2-3 sentences, beginner-friendly cost breakdown)"',
      "  },",
      '  "setupCommands": [',
      '    "string (e.g. \'npx create-next-app@latest my-app\')"',
      "  ],",
      '  "goLiveChecklist": [',
      '    "string (e.g. \'Set environment variables in production\')"',
      "  ]",
      "}",
      "",
      "Rules:",
      "- costEstimation: realistic monthly cost for the starter/free tier, concise explanation",
      "- setupCommands: 4-8 shell commands to bootstrap the project (install deps, init services, etc.)",
      "- goLiveChecklist: 6-10 checklist items a beginner must do before going live",
      "- Write everything as if explaining to someone who has never deployed software before.",
      "",
      "Project information:",
      `Description: ${prompt}`,
      techStackLine,
      projectTypeLine,
    ]
      .filter(Boolean)
      .join("\n");

    // Try up to 2 times before giving up
    let lastError: string = "Unknown error";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await callGemini(aiPrompt, apiKey, model);
        return NextResponse.json(result);
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[project-extras] Attempt ${attempt} failed:`, lastError);
        // Small delay before retry
        if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
      }
    }

    return NextResponse.json(
      {
        error: lastError,
        userMessage:
          "Die KI konnte die Projektdetails gerade nicht laden. Bitte lade die Seite neu oder versuche es später erneut.",
      },
      { status: 502 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: message,
        userMessage: "Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.",
      },
      { status: 500 },
    );
  }
}
