import dagre from "dagre";
import { Position } from "@xyflow/react";
import type { ArchitectureEdge, ArchitectureNode } from "@/types/architecture";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 164;

export type LayoutDirection = "LR" | "TB";

export function layoutGraph(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  direction: LayoutDirection = "LR",
): {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
} {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 130,
    ranksep: 180,
    marginx: 36,
    marginy: 36,
  });

  for (const node of nodes) {
    dagreGraph.setNode(node.id, {
      width: node.width ?? NODE_WIDTH,
      height: node.height ?? NODE_HEIGHT,
    });
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const isHorizontal = direction === "LR";

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);

    if (!dagreNode) {
      return node;
    }

    return {
      ...node,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      position: {
        x: dagreNode.x - (node.width ?? NODE_WIDTH) / 2,
        y: dagreNode.y - (node.height ?? NODE_HEIGHT) / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}
