import { MarkerType } from "@xyflow/react";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureInput,
  ArchitectureNode,
  ParseArchitectureResult,
} from "@/types/architecture";

const nodeSize = {
  width: 280,
  height: 164,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildComponent(input: unknown): ArchitectureComponentInput | null {
  if (!isRecord(input)) {
    return null;
  }

  const name = readString(input.name);
  const tech = readString(input.tech);
  const reason = readString(input.reason);

  if (!name || !tech || !reason) {
    return null;
  }

  return {
    name,
    tech,
    reason,
    alternatives: readStringArray(input.alternatives),
    risks: readStringArray(input.risks),
  };
}

export function parseArchitectureJson(raw: string): ParseArchitectureResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: "Invalid JSON format. Please check commas, quotes, and brackets.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: "Root JSON must be an object with components and connections.",
    };
  }

  if (!Array.isArray(parsed.components) || !Array.isArray(parsed.connections)) {
    return {
      ok: false,
      error: "Both components and connections must be arrays.",
    };
  }

  const components = parsed.components
    .map((component) => buildComponent(component))
    .filter((component): component is ArchitectureComponentInput => component !== null);

  if (components.length === 0) {
    return {
      ok: false,
      error: "At least one valid component is required.",
    };
  }

  if (components.length !== parsed.components.length) {
    return {
      ok: false,
      error: "Every component needs name, tech, and reason fields.",
    };
  }

  const duplicateNames = components
    .map((component) => component.name)
    .filter((name, index, list) => list.indexOf(name) !== index);

  if (duplicateNames.length > 0) {
    return {
      ok: false,
      error: `Duplicate component names are not allowed: ${[...new Set(duplicateNames)].join(", ")}`,
    };
  }

  const connections = parsed.connections
    .map((connection, index) => {
      if (!isRecord(connection)) {
        return null;
      }

      const from = readString(connection.from);
      const to = readString(connection.to);
      const type = readString(connection.type) || "Data flow";

      if (!from || !to) {
        return null;
      }

      return {
        id: `connection-${index}`,
        from,
        to,
        type,
      };
    })
    .filter(
      (
        connection,
      ): connection is {
        id: string;
        from: string;
        to: string;
        type: string;
      } => connection !== null,
    );

  if (connections.length !== parsed.connections.length) {
    return {
      ok: false,
      error: "Every connection needs from and to fields.",
    };
  }

  const componentSet = new Set(components.map((component) => component.name));
  const missingEndpoints = new Set<string>();

  for (const connection of connections) {
    if (!componentSet.has(connection.from)) {
      missingEndpoints.add(connection.from);
    }
    if (!componentSet.has(connection.to)) {
      missingEndpoints.add(connection.to);
    }
  }

  if (missingEndpoints.size > 0) {
    return {
      ok: false,
      error: `Connection references unknown components: ${Array.from(missingEndpoints).join(", ")}`,
    };
  }

  return {
    ok: true,
    data: {
      components,
      connections: connections.map((connection) => ({
        from: connection.from,
        to: connection.to,
        type: connection.type,
      })),
    },
  };
}

function toNodeId(componentName: string): string {
  return componentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function transformArchitectureToGraph(
  input: ArchitectureInput,
  renderVersion: number,
): {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
} {
  const nameToId = new Map<string, string>();

  const nodes: ArchitectureNode[] = input.components.map((component, index) => {
    const baseId = toNodeId(component.name) || `component-${index + 1}`;
    const safeId = nameToId.has(component.name) ? `${baseId}-${index + 1}` : baseId;

    nameToId.set(component.name, safeId);

    return {
      id: safeId,
      type: "architectureNode",
      position: {
        x: index * 40,
        y: index * 20,
      },
      width: nodeSize.width,
      height: nodeSize.height,
      data: {
        component,
        shortReason: component.reason.length > 96 ? `${component.reason.slice(0, 93)}...` : component.reason,
        animationDelayMs: index * 85,
        renderVersion,
      },
    };
  });

  const edges: ArchitectureEdge[] = input.connections.map((connection, index) => ({
    id: `edge-${index + 1}-${toNodeId(connection.from)}-${toNodeId(connection.to)}`,
    source: nameToId.get(connection.from) ?? "",
    target: nameToId.get(connection.to) ?? "",
    animated: true,
    label: connection.type,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: "#22d3ee",
    },
    style: {
      strokeWidth: 2,
      stroke: "#22d3ee",
    },
    labelStyle: {
      fill: "#cbd5e1",
      fontWeight: 600,
      fontSize: 12,
    },
    labelShowBg: true,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 999,
    labelBgStyle: {
      fill: "rgba(15, 23, 42, 0.84)",
      stroke: "rgba(148, 163, 184, 0.38)",
      strokeWidth: 1,
    },
    data: {
      relationType: connection.type,
    },
  }));

  return {
    nodes,
    edges,
  };
}
