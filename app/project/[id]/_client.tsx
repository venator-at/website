"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Download,
  Edit2,
  Layers,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProject,
  duplicateProject,
  getProject,
  updateProject,
} from "@/lib/firebase/projects";
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
import type { Project, ProjectStatus } from "@/types/project";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "draft", label: "Planung", color: "text-slate-400 border-slate-600 bg-slate-800/60" },
  { value: "in-progress", label: "In Entwicklung", color: "text-cyan-300 border-cyan-400/40 bg-cyan-500/10" },
  { value: "completed", label: "Abgeschlossen", color: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10" },
  { value: "launched", label: "Launched", color: "text-violet-300 border-violet-400/40 bg-violet-500/10" },
  { value: "archived", label: "Archiviert", color: "text-slate-500 border-slate-700 bg-slate-900/60" },
];

function getStatusOption(status: ProjectStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
}

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

function generateMarkdown(project: Project, architecture: ArchitectureInput): string {
  const lines: string[] = [];
  lines.push(`# ${project.title}`);
  lines.push("");
  lines.push(`> ${project.prompt}`);
  lines.push("");
  lines.push(`**Status:** ${getStatusOption(project.status).label}  `);
  lines.push(`**Erstellt:** ${formatDate(project.createdAt)}  `);
  lines.push(`**Komponenten:** ${project.componentCount}`);
  lines.push("");

  lines.push("## Tech Stack");
  lines.push("");
  project.techStackArray.forEach((t) => lines.push(`- ${t}`));
  lines.push("");

  lines.push("## Architektur-Komponenten");
  lines.push("");
  architecture.components.forEach((c) => {
    lines.push(`### ${c.name} — ${c.tech}`);
    lines.push("");
    lines.push(c.reason);
    if (c.alternatives.length) {
      lines.push("");
      lines.push(`**Alternativen:** ${c.alternatives.join(", ")}`);
    }
    if (c.risks.length) {
      lines.push("");
      lines.push("**Risiken:**");
      c.risks.forEach((r) => lines.push(`- ${r}`));
    }
    lines.push("");
  });

  if (architecture.roadmap?.length) {
    lines.push("## Roadmap");
    lines.push("");
    architecture.roadmap.forEach((step, i) => {
      lines.push(`${i + 1}. **${step.title}** — ${step.description}`);
    });
    lines.push("");
  }

  if (architecture.costEstimation) {
    lines.push("## Kostenschätzung");
    lines.push("");
    lines.push(`**${architecture.costEstimation.monthlyCost}** pro Monat`);
    lines.push("");
    lines.push(architecture.costEstimation.description);
    lines.push("");
  }

  if (architecture.setupCommands?.length) {
    lines.push("## Setup-Befehle");
    lines.push("");
    lines.push("```bash");
    architecture.setupCommands.forEach((cmd) => lines.push(cmd));
    lines.push("```");
    lines.push("");
  }

  if (architecture.goLiveChecklist?.length) {
    lines.push("## Go-Live Checkliste");
    lines.push("");
    architecture.goLiveChecklist.forEach((item) => lines.push(`- [ ] ${item}`));
    lines.push("");
  }

  if (project.notes?.trim()) {
    lines.push("## Notizen");
    lines.push("");
    lines.push(project.notes.trim());
    lines.push("");
  }

  return lines.join("\n");
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
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasError, setExtrasError] = useState("");

  // Header UI state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicated, setDuplicated] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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

  // Close status dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
        setTitleInput(p.title);

        if (!p.architectureJson) {
          setLoadError("Für dieses Projekt wurde noch keine Architektur generiert.");
          return;
        }

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

  // ── Title editing ──────────────────────────────────────────────────────────
  const startEditingTitle = useCallback(() => {
    if (!project) return;
    setTitleInput(project.title);
    setEditingTitle(true);
    window.setTimeout(() => titleInputRef.current?.select(), 10);
  }, [project]);

  const saveTitle = useCallback(async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || !project || trimmed === project.title) {
      setEditingTitle(false);
      return;
    }
    setProject((p) => (p ? { ...p, title: trimmed } : p));
    setEditingTitle(false);
    await updateProject(projectId, { title: trimmed });
  }, [titleInput, project, projectId]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") void saveTitle();
      if (e.key === "Escape") setEditingTitle(false);
    },
    [saveTitle],
  );

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (status: ProjectStatus) => {
      setStatusOpen(false);
      setProject((p) => (p ? { ...p, status } : p));
      await updateProject(projectId, { status });
    },
    [projectId],
  );

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    await deleteProject(projectId);
    router.push("/dashboard");
  }, [projectId, router]);

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const handleDuplicate = useCallback(async () => {
    if (!project || duplicating) return;
    setDuplicating(true);
    try {
      const newId = await duplicateProject(projectId, `${project.title} (Kopie)`);
      setDuplicated(true);
      window.setTimeout(() => {
        router.push(`/project/${newId}`);
      }, 800);
    } catch {
      setDuplicating(false);
    }
  }, [project, projectId, duplicating, router]);

  // ── Notes change ──────────────────────────────────────────────────────────
  const handleNotesChange = useCallback(
    (notes: string) => {
      setProject((p) => (p ? { ...p, notes } : p));
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
      notesTimeoutRef.current = setTimeout(() => {
        void updateProject(projectId, { notes });
      }, 800);
    },
    [projectId],
  );

  // ── Markdown export ────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!project || !architectureInput) return;
    const md = generateMarkdown(project, architectureInput);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9äöüß\s-]/gi, "").trim().replace(/\s+/g, "-").toLowerCase()}-architektur.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project, architectureInput]);

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

  const statusOpt = project ? getStatusOption(project.status) : STATUS_OPTIONS[0];

  // ── Main view ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="flex flex-col px-4 pb-8 pt-[72px]">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-start justify-between gap-4">
          {/* Left: back + title + meta */}
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex w-fit items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>

            {/* Inline title edit */}
            {project ? (
              editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={titleInputRef}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={() => void saveTitle()}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full max-w-sm rounded-lg border border-cyan-400/40 bg-slate-800/80 px-2 py-1 text-xl font-bold tracking-tight text-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void saveTitle()}
                    className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-1 text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(false)}
                    className="rounded-lg border border-slate-600 bg-slate-800/60 p-1 text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditingTitle}
                  className="group flex w-fit items-center gap-2 text-left"
                  title="Titel bearbeiten"
                >
                  <h1 className="break-words text-2xl font-bold tracking-tight text-slate-50 group-hover:text-slate-200">
                    {project.title}
                  </h1>
                  <Edit2 className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )
            ) : (
              <h1 className="text-2xl font-bold text-slate-50">Projekt</h1>
            )}

            {/* Meta row */}
            {project && (
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
            )}
          </div>

          {/* Right: action buttons */}
          {project && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">

              {/* Status badge dropdown */}
              <div ref={statusRef} className="relative">
                <button
                  type="button"
                  onClick={() => setStatusOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                    statusOpt.color,
                  )}
                >
                  {statusOpt.label}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", statusOpen && "rotate-180")} />
                </button>
                {statusOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => void handleStatusChange(opt.value)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-slate-800",
                          project.status === opt.value ? "text-slate-100" : "text-slate-400",
                        )}
                      >
                        {project.status === opt.value && <Check className="h-3 w-3 text-cyan-400" />}
                        {project.status !== opt.value && <span className="h-3 w-3" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Markdown export */}
              {architectureInput && (
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-200"
                  title="Als Markdown exportieren"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              )}

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => void handleDuplicate()}
                disabled={duplicating}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-200 disabled:opacity-50"
                title="Projekt duplizieren"
              >
                {duplicated ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : duplicating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {duplicated ? "Kopiert!" : "Duplizieren"}
              </button>

              {/* Delete */}
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-2 py-1.5">
                  <span className="text-xs text-red-300">Sicher?</span>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="rounded-lg px-2 py-0.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
                  >
                    Löschen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg p-0.5 text-slate-500 hover:text-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                  title="Projekt löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* New project */}
              <Link
                href="/new"
                className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/25"
              >
                + Neues Projekt
              </Link>
            </div>
          )}
        </div>

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

        {/* ── Architecture error (project exists but no arch) ───────────────── */}
        {loadError && project && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-6 py-4 text-red-200">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <span className="text-sm">{loadError}</span>
          </div>
        )}

        {/* ── Bento Dashboard ───────────────────────────────────────────────── */}
        {dashboardReady && architectureInput ? (
          <div
            className={cn(
              "transition-all duration-700 ease-out",
              dashboardReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            <ProjectDashboard
              projectId={projectId}
              nodes={graphNodes}
              edges={graphEdges}
              architecture={architectureInput}
              extrasLoading={extrasLoading}
              initialCheckedItems={project?.checklistChecked}
              initialNotes={project?.notes}
              onNotesChange={handleNotesChange}
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
