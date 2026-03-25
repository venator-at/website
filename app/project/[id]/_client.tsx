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
import { ProjectDashboard } from "@/components/project/ProjectDashboard";
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
      const VALID_CAT = ["frontend","backend","database","auth","hosting","storage","email","payments","monitoring","queue","realtime","cdn","ai","cms","api","mobile","devops","testing","orm"];
      const VALID_DIFF = ["beginner","intermediate","advanced"];
      const VALID_PRICE = ["free","freemium","paid","open-source"];
      return {
        name: typeof obj.name === "string" ? obj.name.trim() : `Component ${index + 1}`,
        tech: typeof obj.tech === "string" ? obj.tech.trim() : "Unknown Tech",
        reason: reasonRaw.length >= 8 ? reasonRaw : "AI recommendation for this component.",
        alternatives,
        risks,
        category: (VALID_CAT.includes(obj.category as string) ? obj.category : "backend") as import("@/types/architecture").ComponentCategory,
        difficulty: (VALID_DIFF.includes(obj.difficulty as string) ? obj.difficulty : "intermediate") as import("@/types/architecture").ComponentDifficulty,
        pricing: (VALID_PRICE.includes(obj.pricing as string) ? obj.pricing : "freemium") as import("@/types/architecture").ComponentPricing,
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

    // Extract optional extended fields
    const costEstimation =
      typeof parsed.costEstimation === "object" && parsed.costEstimation !== null
        ? {
            monthlyCost: String((parsed.costEstimation as Record<string, unknown>).monthlyCost ?? ""),
            description: String((parsed.costEstimation as Record<string, unknown>).description ?? ""),
          }
        : undefined;

    const roadmap = Array.isArray(parsed.roadmap)
      ? parsed.roadmap
          .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
          .map((s) => ({ title: String(s.title ?? ""), description: String(s.description ?? "") }))
          .filter((s) => s.title && s.description)
      : undefined;

    const learningResources = Array.isArray(parsed.learningResources)
      ? parsed.learningResources
          .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
          .map((r) => ({ title: String(r.title ?? ""), description: String(r.description ?? "") }))
          .filter((r) => r.title && r.description)
      : undefined;

    const setupCommands = Array.isArray(parsed.setupCommands)
      ? parsed.setupCommands.filter((cmd): cmd is string => typeof cmd === "string" && cmd.trim().length > 0)
      : undefined;

    const goLiveChecklist = Array.isArray(parsed.goLiveChecklist)
      ? parsed.goLiveChecklist.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : undefined;

    return {
      components,
      connections,
      ...(costEstimation?.monthlyCost && { costEstimation }),
      ...(roadmap?.length && { roadmap }),
      ...(learningResources?.length && { learningResources }),
      ...(setupCommands?.length && { setupCommands }),
      ...(goLiveChecklist?.length && { goLiveChecklist }),
    };
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
  const [architectureInput, setArchitectureInput] = useState<ArchitectureInput | null>(null);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasError, setExtrasError] = useState("");

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
        const archInput = strictResult.ok
          ? strictResult.data
          : normalizeAiArchitecture(p.architectureJson);

        if (!archInput) {
          setLoadError("Architektur konnte nicht geladen werden.");
          return;
        }

        const transformed = transformArchitectureToGraph(archInput, 1);
        const layouted = layoutGraph(transformed.nodes, transformed.edges, "LR");
        setGraphNodes(layouted.nodes);
        setGraphEdges(layouted.edges);
        setArchitectureInput(archInput);

        // If any of the 3 extra sections are missing, fetch them from AI
        const needsExtras =
          !archInput.costEstimation || !archInput.goLiveChecklist?.length || !archInput.setupCommands?.length;

        if (needsExtras) {
          setExtrasLoading(true);
          fetch("/api/ai/project-extras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: p.prompt,
              techStack: p.techStackArray,
            }),
          })
            .then((res) => res.json().then((data: { userMessage?: string; costEstimation?: ArchitectureInput["costEstimation"]; setupCommands?: string[]; goLiveChecklist?: string[] }) => {
              if (!res.ok) throw new Error(data.userMessage ?? "Fehler beim Laden der KI-Daten.");
              return data;
            }))
            .then((extras: { costEstimation?: ArchitectureInput["costEstimation"]; setupCommands?: string[]; goLiveChecklist?: string[] }) => {
              setArchitectureInput((prev) =>
                prev
                  ? {
                      ...prev,
                      costEstimation: prev.costEstimation ?? extras.costEstimation,
                      setupCommands: prev.setupCommands?.length ? prev.setupCommands : (extras.setupCommands ?? []),
                      goLiveChecklist: prev.goLiveChecklist?.length ? prev.goLiveChecklist : (extras.goLiveChecklist ?? []),
                    }
                  : prev,
              );
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : "Die KI-Daten konnten nicht geladen werden.";
              setExtrasError(msg);
            })
            .finally(() => setExtrasLoading(false));
        }

        window.setTimeout(() => setDashboardReady(true), 40);
      })
      .catch(() => setLoadError("Projekt konnte nicht geladen werden."));
  }, [authLoading, user, projectId, loaded]);

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
    <div className="flex h-screen overflow-hidden flex-col bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="flex flex-1 flex-col overflow-hidden px-4 pb-3 pt-3">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between gap-4">
          {/* Left: back + title */}
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex w-fit items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            {project ? (
              <>
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-50">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {project.componentCount} Komponenten
                  </span>
                  <span className="h-3 w-px bg-slate-700" />
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(project.createdAt)}
                  </span>
                  {loadError && (
                    <>
                      <span className="h-3 w-px bg-slate-700" />
                      <span className="flex items-center gap-1 text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        {loadError}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-slate-50">Projekt</h1>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-2">
            {project && (
              <button
                type="button"
                onClick={() => setInfoExpanded((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                  infoExpanded
                    ? "border-slate-600 bg-slate-800 text-slate-200"
                    : "border-slate-700/60 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-200",
                )}
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
              className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/25"
            >
              + Neues Projekt
            </Link>
          </div>
        </div>

        {/* ── Info panel (collapsible) ──────────────────────────────────────── */}
        {project && infoExpanded && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm">
            <div className="grid grid-cols-1 divide-y divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Prompt */}
              <div className="px-5 py-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <FileText className="h-3 w-3" />
                  Projektbeschreibung
                </p>
                <p className="line-clamp-4 text-sm leading-relaxed text-slate-300">{project.prompt}</p>
              </div>

              {/* Tech stack */}
              <div className="px-5 py-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <Cpu className="h-3 w-3" />
                  Tech Stack
                  <span className="ml-0.5 rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-slate-400">
                    {project.techStackArray.length}
                  </span>
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

        {/* ── Error (with project) ──────────────────────────────────────────── */}
        {loadError && project && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-6 py-4 text-red-200">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <span className="text-sm">{loadError}</span>
          </div>
        )}

        {/* ── Extras error ─────────────────────────────────────────────────── */}
        {extrasError && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-3.5 text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">KI-Details konnten nicht geladen werden</p>
              <p className="mt-0.5 text-xs text-amber-300/70">{extrasError}</p>
            </div>
            <button
              type="button"
              onClick={() => setExtrasError("")}
              className="shrink-0 text-amber-400/60 transition-colors hover:text-amber-300"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Bento Dashboard ───────────────────────────────────────────────── */}
        {dashboardReady && architectureInput ? (
          <div
            className={cn(
              "flex-1 min-h-0 transition-all duration-700 ease-out",
              dashboardReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            <ProjectDashboard
              nodes={graphNodes}
              edges={graphEdges}
              architecture={architectureInput}
              extrasLoading={extrasLoading}
            />
          </div>
        ) : (
          !loadError && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                <p className="text-sm text-slate-500">Dashboard wird geladen…</p>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
