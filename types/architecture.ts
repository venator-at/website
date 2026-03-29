import type { Edge, Node } from "@xyflow/react";

export type ComponentCategory =
  | "frontend"
  | "backend"
  | "database"
  | "auth"
  | "hosting"
  | "storage"
  | "email"
  | "payments"
  | "monitoring"
  | "queue"
  | "realtime"
  | "cdn"
  | "ai"
  | "cms"
  | "api"
  | "mobile"
  | "devops"
  | "testing"
  | "orm";

export type ComponentDifficulty = "beginner" | "intermediate" | "advanced";

export type ComponentPricing = "free" | "freemium" | "paid" | "open-source";

export interface ArchitectureComponentInput {
  name: string;
  tech: string;
  reason: string;
  alternatives: string[];
  risks: string[];
  category: ComponentCategory;
  difficulty: ComponentDifficulty;
  pricing: ComponentPricing;
  docsUrl?: string;
}

export interface ArchitectureConnectionInput {
  from: string;
  to: string;
  type: string;
}

export interface CostEstimation {
  monthlyCost: string;
  description: string;
}

export interface RoadmapStep {
  title: string;
  description: string;
}

export interface LearningResource {
  title: string;
  description: string;
}

export interface ArchitectureInput {
  components: ArchitectureComponentInput[];
  connections: ArchitectureConnectionInput[];
  costEstimation?: CostEstimation;
  roadmap?: RoadmapStep[];
  learningResources?: LearningResource[];
  setupCommands?: string[];
  goLiveChecklist?: string[];
}

export interface ArchitectureNodeData {
  [key: string]: unknown;
  component: ArchitectureComponentInput;
  shortReason: string;
  animationDelayMs: number;
  renderVersion: number;
}

export interface ArchitectureEdgeData {
  [key: string]: unknown;
  relationType: string;
  fromName: string;
  toName: string;
}

export type ArchitectureNode = Node<ArchitectureNodeData, "architectureNode">;
export type ArchitectureEdge = Edge<ArchitectureEdgeData>;

export type ParseArchitectureResult =
  | {
      ok: true;
      data: ArchitectureInput;
    }
  | {
      ok: false;
      error: string;
    };
