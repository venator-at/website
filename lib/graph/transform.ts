import { MarkerType } from "@xyflow/react";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureInput,
  ArchitectureNode,
  ComponentCategory,
  ComponentDifficulty,
  ComponentPricing,
  CostEstimation,
  LearningResource,
  ParseArchitectureResult,
  RoadmapStep,
} from "@/types/architecture";

const VALID_CATEGORIES = new Set<ComponentCategory>([
  "frontend", "backend", "database", "auth", "hosting", "storage",
  "email", "payments", "monitoring", "queue", "realtime", "cdn",
  "ai", "cms", "api", "mobile", "devops", "testing", "orm",
]);

const VALID_DIFFICULTIES = new Set<ComponentDifficulty>(["beginner", "intermediate", "advanced"]);
const VALID_PRICING = new Set<ComponentPricing>(["free", "freemium", "paid", "open-source"]);

const nodeSize = {
  width: 280,
  height: 190,
};

type ConnectionValidationResult =
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      id: string;
      from: string;
      to: string;
      type: string;
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

function validateStringArrayField(
  value: unknown,
  fieldName: "alternatives" | "risks",
  componentName: string,
):
  | { ok: true; value: string[] }
  | {
      ok: false;
      error: string;
    } {
  if (value === undefined) {
    return {
      ok: true,
      value: [],
    };
  }

  if (!Array.isArray(value)) {
    return {
      ok: false,
      error: `Component \"${componentName}\" must define ${fieldName} as an array of strings.`,
    };
  }

  if (value.length > 12) {
    return {
      ok: false,
      error: `Component \"${componentName}\" has too many ${fieldName}. Maximum is 12.`,
    };
  }

  if (value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    return {
      ok: false,
      error: `Component \"${componentName}\" contains invalid values in ${fieldName}.`,
    };
  }

  return {
    ok: true,
    value: readStringArray(value),
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

  if (parsed.components.length > 80) {
    return {
      ok: false,
      error: "Too many components. Maximum supported in one graph is 80.",
    };
  }

  if (parsed.connections.length > 300) {
    return {
      ok: false,
      error: "Too many connections. Maximum supported in one graph is 300.",
    };
  }

  const components: ArchitectureComponentInput[] = [];
  const componentNameByLowercase = new Map<string, string>();

  for (let index = 0; index < parsed.components.length; index += 1) {
    const rawComponent = parsed.components[index];

    if (!isRecord(rawComponent)) {
      return {
        ok: false,
        error: `Component at index ${index} must be an object.`,
      };
    }

    const name = readString(rawComponent.name);
    const tech = readString(rawComponent.tech);
    const reason = readString(rawComponent.reason);

    if (name.length < 2 || name.length > 80) {
      return {
        ok: false,
        error: `Component at index ${index} needs a name between 2 and 80 characters.`,
      };
    }

    if (tech.length < 2 || tech.length > 120) {
      return {
        ok: false,
        error: `Component \"${name}\" needs a tech field between 2 and 120 characters.`,
      };
    }

    if (reason.length < 8 || reason.length > 220) {
      return {
        ok: false,
        error: `Component \"${name}\" needs a reason between 8 and 220 characters.`,
      };
    }

    const normalizedName = name.toLowerCase();

    if (componentNameByLowercase.has(normalizedName)) {
      return {
        ok: false,
        error: `Duplicate component names are not allowed: ${name}`,
      };
    }

    const alternativesResult = validateStringArrayField(
      rawComponent.alternatives,
      "alternatives",
      name,
    );

    if (!alternativesResult.ok) {
      return alternativesResult;
    }

    const risksResult = validateStringArrayField(rawComponent.risks, "risks", name);

    if (!risksResult.ok) {
      return risksResult;
    }

    const rawCategory = readString(rawComponent.category);
    const rawDifficulty = readString(rawComponent.difficulty);
    const rawPricing = readString(rawComponent.pricing);

    if (!VALID_CATEGORIES.has(rawCategory as ComponentCategory)) {
      return {
        ok: false,
        error: `Component "${name}" has invalid category "${rawCategory}". Must be one of: ${[...VALID_CATEGORIES].join(", ")}`,
      };
    }

    if (!VALID_DIFFICULTIES.has(rawDifficulty as ComponentDifficulty)) {
      return {
        ok: false,
        error: `Component "${name}" has invalid difficulty "${rawDifficulty}". Must be: beginner, intermediate, or advanced.`,
      };
    }

    if (!VALID_PRICING.has(rawPricing as ComponentPricing)) {
      return {
        ok: false,
        error: `Component "${name}" has invalid pricing "${rawPricing}". Must be: free, freemium, paid, or open-source.`,
      };
    }

    componentNameByLowercase.set(normalizedName, name);

    components.push({
      name,
      tech,
      reason,
      alternatives: alternativesResult.value,
      risks: risksResult.value,
      category: rawCategory as ComponentCategory,
      difficulty: rawDifficulty as ComponentDifficulty,
      pricing: rawPricing as ComponentPricing,
    });
  }

  if (components.length === 0) {
    return {
      ok: false,
      error: "At least one valid component is required.",
    };
  }

  const normalizedConnections = new Set<string>();

  const connections: ConnectionValidationResult[] = parsed.connections
    .map((connection, index): ConnectionValidationResult => {
      if (!isRecord(connection)) {
        return {
          ok: false,
          error: `Connection at index ${index} must be an object.`,
        };
      }

      const from = readString(connection.from);
      const to = readString(connection.to);
      const type = readString(connection.type);

      if (!from || !to || !type) {
        return {
          ok: false,
          error: `Connection at index ${index} requires from, to, and type fields.`,
        };
      }

      if (from.toLowerCase() === to.toLowerCase()) {
        return {
          ok: false,
          error: `Connection \"${from} -> ${to}\" is invalid. Self-links are not allowed.`,
        };
      }

      const fromCanonical = componentNameByLowercase.get(from.toLowerCase());
      const toCanonical = componentNameByLowercase.get(to.toLowerCase());

      if (!fromCanonical || !toCanonical) {
        const missing = [
          !fromCanonical ? from : null,
          !toCanonical ? to : null,
        ].filter((value): value is string => value !== null);

        return {
          ok: false,
          error: `Connection references unknown components: ${missing.join(", ")}`,
        };
      }

      const normalizedKey = `${fromCanonical.toLowerCase()}->${toCanonical.toLowerCase()}::${type.toLowerCase()}`;

      if (normalizedConnections.has(normalizedKey)) {
        return {
          ok: false,
          error: `Duplicate connection detected: ${fromCanonical} -> ${toCanonical} (${type}).`,
        };
      }

      normalizedConnections.add(normalizedKey);

      return {
        ok: true,
        id: `connection-${index}`,
        from: fromCanonical,
        to: toCanonical,
        type,
      };
    });

  const firstConnectionError = connections.find((connection) => !connection.ok);

  if (firstConnectionError && !firstConnectionError.ok) {
    return {
      ok: false,
      error: firstConnectionError.error,
    };
  }

  const validConnections = connections.filter(
    (
      connection,
    ): connection is {
      ok: true;
      id: string;
      from: string;
      to: string;
      type: string;
    } => connection.ok,
  );

  if (components.length > 1 && validConnections.length === 0) {
    return {
      ok: false,
      error: "Add at least one connection when your architecture has multiple components.",
    };
  }

  const connectedComponentNames = new Set<string>();

  for (const connection of validConnections) {
    connectedComponentNames.add(connection.from);
    connectedComponentNames.add(connection.to);
  }

  const isolatedComponents = components
    .filter((component) => !connectedComponentNames.has(component.name))
    .map((component) => component.name);

  if (components.length > 2 && isolatedComponents.length > 0) {
    return {
      ok: false,
      error: `All components must be connected. Isolated components: ${isolatedComponents.join(", ")}`,
    };
  }

  // Extract optional extended fields leniently
  let costEstimation: CostEstimation | undefined;
  if (isRecord(parsed.costEstimation)) {
    const monthlyCost = readString(parsed.costEstimation.monthlyCost);
    const description = readString(parsed.costEstimation.description);
    if (monthlyCost && description) costEstimation = { monthlyCost, description };
  }

  let roadmap: RoadmapStep[] | undefined;
  if (Array.isArray(parsed.roadmap)) {
    roadmap = parsed.roadmap
      .filter(isRecord)
      .map((step) => ({
        title: readString(step.title),
        description: readString(step.description),
      }))
      .filter((step) => step.title && step.description);
  }

  let learningResources: LearningResource[] | undefined;
  if (Array.isArray(parsed.learningResources)) {
    learningResources = parsed.learningResources
      .filter(isRecord)
      .map((res) => ({
        title: readString(res.title),
        description: readString(res.description),
      }))
      .filter((res) => res.title && res.description);
  }

  let setupCommands: string[] | undefined;
  if (Array.isArray(parsed.setupCommands)) {
    setupCommands = parsed.setupCommands
      .filter((cmd): cmd is string => typeof cmd === "string" && cmd.trim().length > 0)
      .map((cmd) => cmd.trim());
  }

  let goLiveChecklist: string[] | undefined;
  if (Array.isArray(parsed.goLiveChecklist)) {
    goLiveChecklist = parsed.goLiveChecklist
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  }

  return {
    ok: true,
    data: {
      components,
      connections: validConnections.map((connection) => ({
        from: connection.from,
        to: connection.to,
        type: connection.type,
      })),
      ...(costEstimation && { costEstimation }),
      ...(roadmap && { roadmap }),
      ...(learningResources && { learningResources }),
      ...(setupCommands && { setupCommands }),
      ...(goLiveChecklist && { goLiveChecklist }),
    },
  };
}

function shortEdgeLabel(type: string): string {
  const em = type.indexOf(" \u2014 ");
  if (em > 0) return type.slice(0, em);
  const en = type.indexOf(" \u2013 ");
  if (en > 0) return type.slice(0, en);
  return type.length > 32 ? `${type.slice(0, 29)}\u2026` : type;
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
    label: shortEdgeLabel(connection.type),
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
      fromName: connection.from,
      toName: connection.to,
    },
  }));

  return {
    nodes,
    edges,
  };
}
