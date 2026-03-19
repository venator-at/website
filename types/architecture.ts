import type { Edge, Node } from "@xyflow/react";

export interface ArchitectureComponentInput {
  name: string;
  tech: string;
  reason: string;
  alternatives: string[];
  risks: string[];
}

export interface ArchitectureConnectionInput {
  from: string;
  to: string;
  type: string;
}

export interface ArchitectureInput {
  components: ArchitectureComponentInput[];
  connections: ArchitectureConnectionInput[];
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
