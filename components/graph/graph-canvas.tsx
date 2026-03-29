"use client";

import { useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ExportActions } from "@/components/toolbar/export-actions";
import { exportGraphAsPng, exportGraphAsSvg } from "@/lib/export/export-graph";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureNode,
} from "@/types/architecture";
import { ArchitectureNode as ArchitectureNodeCard } from "./architecture-node";
import "@xyflow/react/dist/style.css";

interface GraphCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  onNodeSelect: (component: ArchitectureComponentInput) => void;
  onEdgeSelect: (edge: ArchitectureEdge) => void;
  nodeCount?: number;
  className?: string;
}

const nodeTypes = {
  architectureNode: ArchitectureNodeCard,
};

export function GraphCanvas({
  nodes,
  edges,
  onNodeSelect,
  onEdgeSelect,
  nodeCount,
  className,
}: GraphCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<ArchitectureNode, ArchitectureEdge> | null>(null);
  const [exporting, setExporting] = useState(false);

  const [canvasNodes, setCanvasNodes, onNodesChange] = useNodesState<ArchitectureNode>(nodes);
  const [canvasEdges, setCanvasEdges, onEdgesChange] = useEdgesState<ArchitectureEdge>(edges);

  const hasGraph = canvasNodes.length > 0;

  useEffect(() => {
    setCanvasNodes(nodes);
    setCanvasEdges(edges);
  }, [edges, nodes, setCanvasEdges, setCanvasNodes]);

  useEffect(() => {
    if (!flowInstance || canvasNodes.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      flowInstance.fitView({
        padding: 0.1,
        duration: 850,
        minZoom: 0.5,
      });
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canvasNodes.length, flowInstance]);

  const handleExportPng = async () => {
    if (!wrapperRef.current || !hasGraph) {
      return;
    }

    const exportBaseName = `architecture-graph-${new Date().toISOString().replace(/[:.]/g, "-")}`;

    try {
      setExporting(true);
      await exportGraphAsPng({
        container: wrapperRef.current,
        nodes: canvasNodes,
        fileName: `${exportBaseName}.png`,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportSvg = async () => {
    if (!wrapperRef.current || !hasGraph) {
      return;
    }

    const exportBaseName = `architecture-graph-${new Date().toISOString().replace(/[:.]/g, "-")}`;

    try {
      setExporting(true);
      await exportGraphAsSvg({
        container: wrapperRef.current,
        nodes: canvasNodes,
        fileName: `${exportBaseName}.svg`,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleNodeClick: NodeMouseHandler<ArchitectureNode> = (_, node) => {
    onNodeSelect(node.data.component);
  };

  const handleEdgeClick: EdgeMouseHandler<ArchitectureEdge> = (_, edge) => {
    onEdgeSelect(edge);
  };

  return (
    <section className={cn("glass-panel neon-ring relative flex w-full flex-col overflow-hidden rounded-2xl", className ?? "h-[520px]")}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_84%_78%,rgba(168,85,247,0.12),transparent_30%)]" />
      <div className="relative flex items-center justify-between gap-3 border-b border-slate-700/70 bg-slate-950/45 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-100">Architecture Graph</h2>
          <p className="text-xs text-slate-400">
            {nodeCount != null ? (
              <><span className="text-slate-300 font-medium">{nodeCount} components</span> · drag, zoom &amp; click to inspect</>
            ) : (
              "Drag, zoom, and inspect nodes. Click a node for full component details."
            )}
          </p>
        </div>
        <ExportActions
          disabled={!hasGraph}
          isExporting={exporting}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
        />
      </div>

      <div ref={wrapperRef} className="relative min-h-0 flex-1">
        <ReactFlow<ArchitectureNode, ArchitectureEdge>
          nodes={canvasNodes}
          edges={canvasEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onInit={setFlowInstance}
          fitView
          fitViewOptions={{ padding: 0.1, minZoom: 0.5 }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          panOnScroll={false}
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
          preventScrolling
          selectionOnDrag={false}
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: "#0f766e" },
          }}
          className="!h-full !w-full !bg-transparent [&_.react-flow__pane]:cursor-grab [&_.react-flow__pane:active]:cursor-grabbing [&_.react-flow__edge]:cursor-pointer"
        >
          <Background
            variant={BackgroundVariant.Dots}
            color="#2dd4bf"
            gap={18}
            size={1.2}
          />
          <MiniMap
            pannable
            zoomable
            nodeColor="#22d3ee"
            nodeStrokeColor="#155e75"
            maskColor="rgba(2, 6, 23, 0.58)"
            className="!border !border-slate-600 !bg-slate-900/90"
          />
          <Controls className="!border !border-slate-600 !bg-slate-900/80" />
        </ReactFlow>
      </div>
    </section>
  );
}
