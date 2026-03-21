"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Layers,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getProject } from "@/lib/firebase/projects";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { parseArchitectureJson, transformArchitectureToGraph } from "@/lib/graph/transform";
import { layoutGraph } from "@/lib/graph/layout";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { cn } from "@/lib/utils";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureInput,
  ArchitectureNode,
} from "@/types/architecture";
import type { Project } from "@/types/project";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Lenient fallback parser — same as in the /new page */
function normalizeAiArchitecture(jsonText: string): ArchitectureInput | null {
  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const rawComponents = Array.isArray(parsed.components) ? parsed.components : [];
    const rawConnections = Array.isArray(parsed.connections) ? parsed.connections : [];
    if (rawComponents.length === 0) return null;

    const components: ArchitectureComponentInput[] = rawComponents.map((component, index) => {
      const obj =
        typeof component === "object" && component !== null
          ? (component as Record<string, unknown>)
          : {};
      const alternatives = Array.isArray(obj.alternatives)
        ? obj.alternatives
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      const risks = Array.isArray(obj.risks)
        ? obj.risks
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      const reasonRaw = typeof obj.reason === "string" ? obj.reason.trim() : "";
      return {
        name: typeof obj.name === "string" ? obj.name.trim() : `Component ${index + 1}`,
        tech: typeof obj.tech === "string" ? obj.tech.trim() : "Unknown Tech",
        reason: reasonRaw.length >= 8 ? reasonRaw : "AI recommendation for this component.",
        alternatives,
        risks,
      };
    });

    const componentNames = new Set(components.map((c) => c.name));
    let connections = rawConnections
      .map((c) => {
        const obj =
          typeof c === "object" && c !== null ? (c as Record<string, unknown>) : {};
        return {
          from: typeof obj.from === "string" ? obj.from.trim() : "",
          to: typeof obj.to === "string" ? obj.to.trim() : "",
          type: typeof obj.type === "string" ? obj.type.trim() : "data flow",
        };
      })
      .filter(
        (c) => c.from && c.to && c.from !== c.to && componentNames.has(c.from) && componentNames.has(c.to),
      );

    if (components.length > 1 && connections.length === 0) {
      connections = components
        .slice(0, -1)
        .map((c, i) => ({ from: c.name, to: components[i + 1].name, type: "data flow" }));
    }
    return { components, connections };
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectPageClient({ projectId }: { projectId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loadError, setLoadError] = useState("");
  const [graphNodes, setGraphNodes] = useState<ArchitectureNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ArchitectureEdge[]>([]);
  const [graphContainerOpen, setGraphContainerOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentInput | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const firebaseConfigured = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ].every((v) => typeof v === "string" && v.trim().length > 0);

  // Redirect if not logged in
  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router, firebaseConfigured]);

  // Load project once user is known
  useEffect(() => {
    if (authLoading || !user || loaded) return;
    setLoaded(true);

    getProject(projectId)
      .then((p) => {
        if (!p) {
          setLoadError("Projekt nicht gefunden.");
          return;
        }
        if (p.userId !== user.uid) {
          setLoadError("Kein Zugriff auf dieses Projekt.");
          return;
        }
        setProject(p);

        if (!p.architectureJson) {
          setLoadError("Für dieses Projekt wurde noch keine Architektur generiert.");
          return;
        }

        // Try strict parser first, fall back to lenient normalizer
        const strictResult = parseArchitectureJson(p.architectureJson);
        const architectureInput = strictResult.ok
          ? strictResult.data
          : normalizeAiArchitecture(p.architectureJson);

        if (!architectureInput) {
          setLoadError("Architektur konnte nicht geladen werden.");
          return;
        }

        const transformed = transformArchitectureToGraph(architectureInput, 1);
        const layouted = layoutGraph(transformed.nodes, transformed.edges, "LR");
        setGraphNodes(layouted.nodes);
        setGraphEdges(layouted.edges);

        window.setTimeout(() => setGraphContainerOpen(true), 40);
      })
      .catch(() => setLoadError("Projekt konnte nicht geladen werden."));
  }, [authLoading, user, projectId, loaded]);

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (authLoading || (!loaded && !loadError)) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-950">
        <DashboardHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full border border-cyan-300/25 bg-slate-900/70 p-5 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
            <p className="text-sm text-slate-500">Projekt wird geladen…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────────────
  if (loadError && !project) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-950">
        <DashboardHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-6 py-4 text-red-200">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <span className="text-sm">{loadError}</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-3">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between gap-4">
          {/* Left: back + title */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href="/dashboard"
              className="mb-1 flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            {project ? (
              <>
                <h1 className="truncate text-xl font-bold tracking-tight text-slate-50">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {project.componentCount} Komponenten
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(project.createdAt)}
                  </span>
                  {loadError && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      {loadError}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <h1 className="text-xl font-bold text-slate-50">Projekt</h1>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-2">
            {project && (
              <button
                type="button"
                onClick={() => setInfoExpanded((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
              >
                <FileText className="h-3.5 w-3.5" />
                Info
                {infoExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
            <Link
              href="/new"
              className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/25"
            >
              + Neues Projekt
            </Link>
          </div>
        </div>

        {/* ── Info panel (collapsible) ──────────────────────────────────────── */}
        {project && infoExpanded && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-0 divide-y divide-white/6 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Prompt */}
              <div className="px-4 py-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <FileText className="h-3 w-3" />
                  Projektbeschreibung
                </p>
                <p className="text-sm leading-relaxed text-slate-300 line-clamp-4">{project.prompt}</p>
              </div>

              {/* Tech stack */}
              <div className="px-4 py-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Cpu className="h-3 w-3" />
                  Tech Stack ({project.techStackArray.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStackArray.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-lg border border-cyan-400/20 bg-cyan-400/8 px-2 py-0.5 text-xs text-cyan-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStackArray.length === 0 && (
                    <span className="text-xs text-slate-600">Keine Daten</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Graph area ───────────────────────────────────────────────────── */}
        {loadError && project ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-6 py-4 text-red-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
              <span className="text-sm">{loadError}</span>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück zum Dashboard
            </Link>
          </div>
        ) : (
          <div
            className={cn(
              "min-h-0 flex-1 flex flex-col overflow-hidden rounded-2xl transition-all duration-700 ease-out",
              graphContainerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}
          >
            {graphContainerOpen && graphNodes.length > 0 ? (
              <GraphCanvas nodes={graphNodes} edges={graphEdges} onNodeSelect={handleNodeSelect} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60 text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-400" />
                Graph wird geladen…
              </div>
            )}
          </div>
        )}
      </main>

      <ComponentDetailsSheet
        component={selectedComponent}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
