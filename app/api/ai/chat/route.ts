import { NextResponse } from "next/server";

interface ChatRequest {
  message?: string;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const respond = (body: Record<string, unknown>, status: number) => {
    const response = NextResponse.json({ ...body, requestId }, { status });
    response.headers.set("x-request-id", requestId);
    return response;
  };

  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return respond({ error: "Please provide a message." }, 400);
    }

    const apiKey = (
      process.env.GOOGLE_AI_STUDIO_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.GEMINI_API_KEY
    )?.trim();
    const model = process.env.GOOGLE_AI_MODEL ?? "gemini-3-flash-preview";

    if (!apiKey) {
      return respond({ error: "Missing Google AI key." }, 500);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return respond({ error: `AI request failed: ${response.status} ${errorText}` }, 502);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (!text) {
      return respond({ error: "AI returned no response." }, 502);
    }

    return respond({ text }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return respond({ error: message }, 500);
  }
}
