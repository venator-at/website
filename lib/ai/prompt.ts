import { ARCHITECTURE_JSON_PATTERN } from "@/lib/ai/jsonPattern";

export function buildArchitectureGeneratorPrompt(userIdea: string): string {
  return [
    "You are a senior software architect for beginners.",
    "Return ONLY valid JSON. No markdown. No explanation. No code fences.",
    "Use realistic technologies and clear naming.",
    ARCHITECTURE_JSON_PATTERN,
    "Project idea from user:",
    userIdea,
  ].join("\n\n");
}
