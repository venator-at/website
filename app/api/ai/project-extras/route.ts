import { NextResponse } from "next/server";

interface ProjectExtrasRequest {
  prompt?: string;
  techStack?: string[];
  projectType?: string;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProjectExtrasRequest;
    const prompt = body.prompt?.trim();
    const techStack = Array.isArray(body.techStack) ? body.techStack : [];
    const projectType = body.projectType?.trim() ?? "";

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const apiKey = (
      process.env.GOOGLE_AI_STUDIO_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.GEMINI_API_KEY
    )?.trim();
    const model = process.env.GOOGLE_AI_MODEL || "gemini-3-flash-preview";

    if (!apiKey) {
      return NextResponse.json({ error: "Missing Google AI key." }, { status: 500 });
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
      return NextResponse.json(
        { error: `Gemini request failed: ${response.status} ${errorText}` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const generatedText =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("\n")
        .trim() ?? "";

    if (!generatedText) {
      return NextResponse.json({ error: "Gemini returned no output." }, { status: 502 });
    }

    const jsonText = extractJsonFromText(generatedText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "Gemini output was not valid JSON.", raw: generatedText }, { status: 502 });
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

    return NextResponse.json({ costEstimation, setupCommands, goLiveChecklist });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
