"use client";

import { useState, useCallback, useRef } from "react";
import {
  BookOpen,
  Check,
  CheckSquare,
  Copy,
  DollarSign,
  Loader2,
  Map,
  Terminal,
} from "lucide-react";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { ConnectionDetailsSheet } from "@/components/panels/connection-details-sheet";
import { saveChecklistChecked } from "@/lib/firebase/projects";
import { cn } from "@/lib/utils";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureInput,
  ArchitectureNode,
} from "@/types/architecture";

interface ProjectDashboardProps {
  projectId: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  architecture: ArchitectureInput;
  extrasLoading?: boolean;
  initialCheckedItems?: number[];
}

type TabId = "roadmap" | "cost" | "checklist" | "setup" | "resources";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "cost", label: "Kosten", icon: DollarSign },
  { id: "checklist", label: "Checkliste", icon: CheckSquare },
  { id: "setup", label: "Setup", icon: Terminal },
  { id: "resources", label: "Lernen", icon: BookOpen },
];

const EXTRAS_TABS: TabId[] = ["cost", "checklist", "setup"];

export function ProjectDashboard({
  projectId,
  nodes,
  edges,
  architecture,
  extrasLoading,
  initialCheckedItems,
}: ProjectDashboardProps) {
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentInput | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<ArchitectureEdge | null>(null);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(
    new Set(initialCheckedItems ?? []),
  );
  const [activeTab, setActiveTab] = useState<TabId>("roadmap");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  const handleEdgeSelect = useCallback((edge: ArchitectureEdge) => {
    setSelectedEdge(edge);
    setConnectionOpen(true);
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
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void saveChecklistChecked(projectId, Array.from(next));
      }, 600);
      return next;
    });
  };

  const checkedCount = checkedItems.size;
  const totalChecklist = architecture.goLiveChecklist?.length ?? 0;

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* ── 1. Architecture Graph ─────────────────────────────────────────── */}
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
          nodeCount={nodes.length}
        />

        {/* ── 2. Tabbed Info Panel ──────────────────────────────────────────── */}
        <div className="glass-panel neon-ring flex h-[360px] flex-col overflow-hidden rounded-2xl">

          {/* Tab bar */}
          <div className="flex shrink-0 items-end gap-0.5 border-b border-white/8 bg-slate-950/50 px-2 pt-1.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-all",
                  activeTab === id
                    ? "bg-slate-800/70 text-slate-100"
                    : "text-slate-500 hover:bg-slate-800/30 hover:text-slate-300",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>

                {/* Active indicator */}
                {activeTab === id && (
                  <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-primary" />
                )}

                {/* Checklist progress badge */}
                {id === "checklist" && totalChecklist > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                      checkedCount === totalChecklist
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-violet-500/20 text-violet-300",
                    )}
                  >
                    {checkedCount}/{totalChecklist}
                  </span>
                )}

                {/* Loading spinner for extras tabs */}
                {extrasLoading && EXTRAS_TABS.includes(id) && (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === "roadmap" && (
              <RoadmapContent roadmap={architecture.roadmap} />
            )}
            {activeTab === "cost" && (
              <CostContent cost={architecture.costEstimation} loading={extrasLoading} />
            )}
            {activeTab === "checklist" && (
              <ChecklistContent
                items={architecture.goLiveChecklist ?? []}
                loading={extrasLoading}
                checkedItems={checkedItems}
                onToggle={toggleChecked}
              />
            )}
            {activeTab === "setup" && (
              <SetupContent
                commands={architecture.setupCommands ?? []}
                loading={extrasLoading}
                copiedIndex={copiedIndex}
                onCopy={handleCopyCommand}
              />
            )}
            {activeTab === "resources" && (
              <ResourcesContent resources={architecture.learningResources} />
            )}
          </div>
        </div>
      </div>

      <ComponentDetailsSheet
        component={selectedComponent}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      <ConnectionDetailsSheet
        edge={selectedEdge}
        open={connectionOpen}
        onOpenChange={setConnectionOpen}
      />
    </>
  );
}

// ── Tab content components ────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function RoadmapContent({ roadmap }: { roadmap?: { title: string; description: string }[] }) {
  if (!roadmap?.length) {
    return <EmptyState message="Kein Roadmap verfügbar." />;
  }
  return (
    <div className="flex flex-col gap-1.5 p-4">
      {roadmap.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0 pb-1.5">
            <p className="text-xs font-semibold text-slate-100 leading-snug">{step.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CostContent({
  cost,
  loading,
}: {
  cost?: { monthlyCost: string; description: string };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 animate-pulse">
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-3 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>
    );
  }
  if (!cost) return <EmptyState message="Keine Kostenschätzung verfügbar." />;
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 text-center">
        <p className="text-3xl font-bold text-emerald-300">{cost.monthlyCost}</p>
        <p className="mt-1 text-xs text-slate-500">pro Monat (geschätzt)</p>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">{cost.description}</p>
    </div>
  );
}

function ChecklistContent({
  items,
  loading,
  checkedItems,
  onToggle,
}: {
  items: string[];
  loading?: boolean;
  checkedItems: Set<number>;
  onToggle: (i: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2.5 p-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-4 w-4 shrink-0 rounded border border-white/10 bg-white/5" />
            <div
              className="h-3 rounded bg-white/5"
              style={{ width: `${60 + (i % 3) * 15}%` }}
            />
          </div>
        ))}
      </div>
    );
  }
  if (!items.length) return <EmptyState message="Keine Einträge verfügbar." />;
  return (
    <ul className="flex flex-col gap-2 p-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => onToggle(i)}
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
              checkedItems.has(i)
                ? "border-violet-400 bg-violet-400/25 shadow-[0_0_8px_rgba(167,139,250,0.25)]"
                : "border-white/20 bg-white/4 hover:border-violet-400/60",
            )}
          >
            {checkedItems.has(i) && <Check className="h-2.5 w-2.5 text-violet-300" />}
          </button>
          <span
            className={cn(
              "text-xs leading-relaxed transition-colors",
              checkedItems.has(i) ? "text-slate-600 line-through" : "text-slate-300",
            )}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SetupContent({
  commands,
  loading,
  copiedIndex,
  onCopy,
}: {
  commands: string[];
  loading?: boolean;
  copiedIndex: number | null;
  onCopy: (cmd: string, index: number) => void;
}) {
  return (
    <div className="p-3">
      <div className="overflow-hidden rounded-xl border border-white/8 bg-slate-950/80">
        {/* Terminal title bar */}
        <div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-2 text-xs text-slate-600">terminal</span>
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2 animate-pulse"
              >
                <span className="select-none text-xs text-cyan-400/40">$</span>
                <div
                  className="h-3 rounded bg-white/8"
                  style={{ width: `${40 + (i % 4) * 12}%` }}
                />
              </div>
            ))
          ) : commands.length === 0 ? (
            <p className="px-2 text-xs text-slate-500">Keine Befehle verfügbar.</p>
          ) : (
            commands.map((cmd, i) => (
              <div
                key={i}
                className="group flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2 transition-colors hover:bg-white/5"
              >
                <span className="select-none text-xs text-cyan-400">$</span>
                <code className="flex-1 font-mono text-xs text-slate-300">{cmd}</code>
                <button
                  type="button"
                  onClick={() => onCopy(cmd, i)}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-500 hover:text-slate-200"
                  title="Kopieren"
                >
                  {copiedIndex === i ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ResourcesContent({
  resources,
}: {
  resources?: { title: string; description: string }[];
}) {
  if (!resources?.length) return <EmptyState message="Keine Lernressourcen verfügbar." />;
  return (
    <div className="flex flex-col gap-2 p-4">
      {resources.map((res, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3"
        >
          <p className="text-xs font-semibold text-slate-100">{res.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{res.description}</p>
        </div>
      ))}
    </div>
  );
}
