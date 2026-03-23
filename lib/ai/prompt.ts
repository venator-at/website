import { ARCHITECTURE_JSON_PATTERN } from "@/lib/ai/jsonPattern";

export interface ProjectContext {
  projectType?: string;
  experienceLevel?: string;
  budgetLevel?: string;
}

export function buildArchitectureGeneratorPrompt(userIdea: string, context?: ProjectContext): string {
  const contextLines: string[] = [];

  if (context?.projectType) contextLines.push(`Project type: ${context.projectType}`);
  if (context?.experienceLevel) contextLines.push(`Developer experience level: ${context.experienceLevel}`);
  if (context?.budgetLevel) contextLines.push(`Budget range: ${context.budgetLevel}`);

  return [
    "You are a senior software architect explaining technology decisions to complete beginners.",
    "Return ONLY valid JSON. No markdown. No explanation. No code fences.",
    "Use realistic technologies and clear naming.",
    "Tailor your recommendations to the project context provided.",
    ARCHITECTURE_JSON_PATTERN,
    contextLines.length > 0 ? `Project context:\n${contextLines.join("\n")}` : "",
    "Project idea from user:",
    userIdea,
  ]
    .filter(Boolean)
    .join("\n\n");
}
