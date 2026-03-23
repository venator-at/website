import { ARCHITECTURE_JSON_PATTERN } from "@/lib/ai/jsonPattern";

export function buildArchitectureGeneratorPrompt(userIdea: string): string {
  return [
    "You are a senior software architect explaining technology decisions to complete beginners.",
    "Return ONLY valid JSON. No markdown. No explanation. No code fences.",
    ARCHITECTURE_JSON_PATTERN,
    "Project idea from user:",
    userIdea,
  ].join("\n\n");
}
