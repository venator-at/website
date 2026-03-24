"use client";

import { useState, useCallback } from "react";
import {
  CheckSquare,
  Check,
  Copy,
  DollarSign,
  Loader2,
  Network,
  Terminal,
} from "lucide-react";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { cn } from "@/lib/utils";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureInput,
  ArchitectureNode,
} from "@/types/architecture";

interface ProjectDashboardProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  architecture: ArchitectureInput;
  extrasLoading?: boolean;
}

export function ProjectDashboard({ nodes, edges, architecture, extrasLoading }: ProjectDashboardProps) {
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentInput | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  const handleCopyCommand = (command: string, index: number) => {
    void navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleChecked = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const tile = "bg-slate-900/60 backdrop-blur-sm border border-white/8 rounded-2xl overflow-hidden";

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* ── 1. Architektur-Graph (largest tile) ──────────────────────── */}
        <div className={cn(tile, "lg:col-span-2 lg:row-span-2 flex flex-col h-[500px]")}>
          <div className="flex items-center gap-2 border-b border-white/6 px-5 py-3.5">
            <div className="rounded-lg bg-cyan-500/15 p-1.5">
              <Network className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-slate-200">Architektur-Graph</span>
            <span className="ml-auto text-xs text-slate-500">{nodes.length} Komponenten</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <GraphCanvas nodes={nodes} edges={edges} onNodeSelect={handleNodeSelect} />
          </div>
        </div>

        {/* ── 2. Kostenabschätzung ──────────────────────────────────────── */}
        <div className={cn(tile, "flex flex-col gap-4 p-5")}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/15 p-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-slate-200">Kostenabschätzung</span>
            {extrasLoading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-500" />}
          </div>
          {extrasLoading ? (
            <div className="flex flex-col gap-2 animate-pulse">
              <div className="h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
          ) : architecture.costEstimation ? (
            <>
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-300">
                  {architecture.costEstimation.monthlyCost}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">pro Monat</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                {architecture.costEstimation.description}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">Keine Kostenschätzung verfügbar.</p>
          )}
        </div>

        {/* ── 3. Go-Live Checkliste ─────────────────────────────────────── */}
        <div className={cn(tile, "flex flex-col gap-4 p-5")}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-violet-500/15 p-1.5">
              <CheckSquare className="h-4 w-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-slate-200">Go-Live Checkliste</span>
            {extrasLoading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-500" />}
          </div>
          {extrasLoading ? (
            <div className="flex flex-col gap-2.5 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-4 w-4 shrink-0 rounded border border-white/10 bg-white/5" />
                  <div className="h-3 rounded bg-white/5" style={{ width: `${60 + (i % 3) * 15}%` }} />
                </div>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {(architecture.goLiveChecklist ?? []).map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleChecked(i)}
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      checkedItems.has(i)
                        ? "border-violet-400 bg-violet-400/25"
                        : "border-white/20 bg-white/4 hover:border-violet-400/60",
                    )}
                  >
                    {checkedItems.has(i) && <Check className="h-2.5 w-2.5 text-violet-300" />}
                  </button>
                  <span
                    className={cn(
                      "text-xs leading-relaxed text-slate-300 transition-colors",
                      checkedItems.has(i) && "text-slate-600 line-through",
                    )}
                  >
                    {item}
                  </span>
                </li>
              ))}
              {!architecture.goLiveChecklist?.length && (
                <p className="text-xs text-slate-500">Keine Einträge verfügbar.</p>
              )}
            </ul>
          )}
        </div>

        {/* ── 4. Setup-Befehle (Terminal) ───────────────────────────────── */}
        <div className={cn(tile, "flex flex-col gap-4 p-5 md:col-span-2")}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-500/15 p-1.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-slate-200">Setup-Befehle</span>
            {extrasLoading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-500" />}
          </div>
          <div className="overflow-hidden rounded-xl border border-white/8 bg-slate-950/80">
            {/* Terminal title bar */}
            <div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-xs text-slate-600">terminal</span>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {extrasLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2 animate-pulse">
                    <span className="select-none text-xs text-cyan-400/40">$</span>
                    <div className="h-3 rounded bg-white/8" style={{ width: `${40 + (i % 4) * 12}%` }} />
                  </div>
                ))
              ) : (
                <>
                  {(architecture.setupCommands ?? []).map((cmd, i) => (
                    <div
                      key={i}
                      className="group flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <span className="select-none text-xs text-cyan-400">$</span>
                      <code className="flex-1 font-mono text-xs text-slate-300">{cmd}</code>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand(cmd, i)}
                        className="opacity-0 transition-opacity hover:text-slate-200 group-hover:opacity-100 text-slate-500"
                        title="Kopieren"
                      >
                        {copiedIndex === i ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                  {!architecture.setupCommands?.length && (
                    <p className="px-2 text-xs text-slate-500">Keine Befehle verfügbar.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>


      </div>

      <ComponentDetailsSheet
        component={selectedComponent}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
