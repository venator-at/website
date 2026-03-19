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
  type NodeMouseHandler,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Loader2, MoveRight } from "lucide-react";
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
  isLoading: boolean;
  onNodeSelect: (component: ArchitectureComponentInput) => void;
}

const nodeTypes = {
  architectureNode: ArchitectureNodeCard,
};

export function GraphCanvas({
  nodes,
  edges,
  isLoading,
  onNodeSelect,
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
        padding: 0.2,
        duration: 850,
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

  return (
    <section className="glass-panel neon-ring relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_84%_78%,rgba(168,85,247,0.12),transparent_30%)]" />
      <div className="relative flex items-center justify-between gap-3 border-b border-slate-700/70 bg-slate-950/45 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-100">Architecture Graph</h2>
          <p className="text-xs text-slate-300">
            Drag, zoom, and inspect nodes. Click a node for full component details.
          </p>
        </div>
        <ExportActions
          disabled={!hasGraph}
          isExporting={exporting}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
        />
      </div>

      <div ref={wrapperRef} className="relative flex-1">
        {!hasGraph && !isLoading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/60 p-8 text-center backdrop-blur-sm">
            <div className="rounded-full border border-cyan-300/35 bg-cyan-400/15 p-3 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <MoveRight className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Your graph will appear here</h3>
              <p className="max-w-md text-sm text-slate-300">
                Paste your architecture JSON and click Generate Graph to build an interactive diagram.
              </p>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            <p className="text-sm font-medium text-slate-100">Preparing graph and running entrance animation...</p>
          </div>
        ) : null}

        <ReactFlow<ArchitectureNode, ArchitectureEdge>
          nodes={canvasNodes}
          edges={canvasEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onInit={setFlowInstance}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: "#0f766e" },
          }}
          className="!bg-transparent"
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
