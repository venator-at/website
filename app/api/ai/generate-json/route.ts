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
  try {
    const body = (await request.json()) as GenerateJsonRequest;
    const idea = body.idea?.trim();

    if (!idea) {
      return NextResponse.json({ error: "Please provide an idea." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    const model = process.env.GOOGLE_AI_MODEL || "gemini-3.0-flash-preview";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_AI_STUDIO_API_KEY in environment." },
        { status: 500 },
      );
    }

    const prompt = buildArchitectureGeneratorPrompt(idea);

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
      return NextResponse.json(
        { error: `Gemini request failed: ${response.status} ${errorText}` },
        { status: 502 },
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
      return NextResponse.json(
        { error: "Gemini returned no text output." },
        { status: 502 },
      );
    }

    const jsonText = extractJsonFromModelText(generatedText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini output was not valid JSON.",
          raw: generatedText,
        },
        { status: 502 },
      );
    }

    const shapeCheck = basicArchitectureShapeValidation(parsed);
    if (!shapeCheck.ok) {
      return NextResponse.json(
        {
          error: shapeCheck.error,
          raw: parsed,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      jsonText: JSON.stringify(parsed, null, 2),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
