"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { JsonEditor } from "@/components/input/json-editor";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { layoutGraph } from "@/lib/graph/layout";
import {
  parseArchitectureJson,
  transformArchitectureToGraph,
} from "@/lib/graph/transform";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureNode,
} from "@/types/architecture";

const SAMPLE_JSON = `{
  "components": [
    {
      "name": "Next.js Frontend",
      "tech": "Next.js 15 + Tailwind CSS",
      "reason": "Fast iteration with server and client rendering plus robust ecosystem",
      "alternatives": ["Nuxt", "SvelteKit"],
      "risks": ["Hydration mismatch if server/client state diverges"]
    },
    {
      "name": "Backend",
      "tech": "Node.js + Express",
      "reason": "Simple API development and broad community support",
      "alternatives": ["Spring Boot", "Django"],
      "risks": ["Callback complexity with weak structure"]
    },
    {
      "name": "Database",
      "tech": "PostgreSQL",
      "reason": "Relational consistency and strong tooling",
      "alternatives": ["MongoDB", "MySQL"],
      "risks": ["Schema migrations require discipline"]
    }
  ],
  "connections": [
    {
      "from": "Next.js Frontend",
      "to": "Backend",
      "type": "REST API"
    },
    {
      "from": "Backend",
      "to": "Database",
      "type": "SQL"
    }
  ]
}`;

export default function Dashboard() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [selectedComponent, setSelectedComponent] =
    useState<ArchitectureComponentInput | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const renderVersionRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  const handleGenerateGraph = useCallback(() => {
    const parseResult = parseArchitectureJson(jsonInput);

    if (!parseResult.ok) {
      clearPendingTimer();
      setIsLoading(false);
      setError(parseResult.error);
      return;
    }

    renderVersionRef.current += 1;

    const transformed = transformArchitectureToGraph(
      parseResult.data,
      renderVersionRef.current,
    );
    const direction = parseResult.data.components.length > 14 ? "TB" : "LR";
    const layouted = layoutGraph(transformed.nodes, transformed.edges, direction);

    clearPendingTimer();
    setError(null);
    setIsLoading(true);
    setIsSheetOpen(false);
    setSelectedComponent(null);

    timerRef.current = window.setTimeout(() => {
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setIsLoading(false);
      timerRef.current = null;
    }, 2000);
  }, [clearPendingTimer, jsonInput]);

  const handleSelectNode = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setIsSheetOpen(true);
  }, []);

  const handleLoadSample = useCallback(() => {
    setJsonInput(SAMPLE_JSON);
    setError(null);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-32 top-28 -z-10 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse [animation-delay:700ms]" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/2 -z-10 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.35),rgba(2,6,23,0.85))]" />

      <main className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
        <header className="glass-panel neon-ring relative overflow-hidden rounded-2xl p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/0 via-cyan-300/80 to-cyan-300/0" />
          <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            JSON to Architecture Graph
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-100 md:text-4xl text-balance">
            Build a scalable architecture map from plain JSON
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Submit your architecture definition and get an animated React Flow graph after a 2-second reveal delay. Nodes are interactive, draggable, zoomable, and exportable as PNG or SVG.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(360px,520px)_1fr]">
          <JsonEditor
            value={jsonInput}
            onChange={setJsonInput}
            onGenerate={handleGenerateGraph}
            onLoadSample={handleLoadSample}
            isLoading={isLoading}
            error={error}
          />

          <GraphCanvas
            nodes={nodes}
            edges={edges}
            isLoading={isLoading}
            onNodeSelect={handleSelectNode}
          />
        </section>
      </main>

      <ComponentDetailsSheet
        component={selectedComponent}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
