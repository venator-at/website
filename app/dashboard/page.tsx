"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GitBranch,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import {
  createProject,
  deleteProject,
  subscribeToProjects,
} from "@/lib/firebase/projects";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { parseArchitectureJson, transformArchitectureToGraph } from "@/lib/graph/transform";
import { layoutGraph } from "@/lib/graph/layout";
import type { Project } from "@/types/project";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureInput,
  ArchitectureNode,
} from "@/types/architecture";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ElegantShape } from "@/components/ui/shape-landing-hero";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 37) + "…";
}

function buildLocalFallbackArchitecture(idea: string): ArchitectureInput {
  const title = idea.split(/[.!?\n]/)[0]?.trim() || "User platform";

  return {
    components: [
      {
        name: "Frontend",
        tech: "Next.js",
        reason: `User interface for: ${title}`.slice(0, 220),
        alternatives: ["Nuxt", "SvelteKit"],
        risks: ["Complex UI state can grow quickly"],
      },
      {
        name: "API",
        tech: "Node.js + Fastify",
        reason: "Central business logic and secure access to backend services.",
        alternatives: ["NestJS", "FastAPI"],
        risks: ["Insufficient validation can break data contracts"],
      },
      {
        name: "Database",
        tech: "PostgreSQL",
        reason: "Reliable relational storage for users, projects, and domain entities.",
        alternatives: ["MySQL", "MongoDB"],
        risks: ["Schema migrations need discipline"],
      },
      {
        name: "Auth",
        tech: "Supabase Auth",
        reason: "Managed authentication with quick setup for sign-in and session handling.",
        alternatives: ["Firebase Auth", "Auth.js"],
        risks: ["Provider lock-in if abstraction is missing"],
      },
    ],
    connections: [
      { from: "Frontend", to: "API", type: "HTTPS requests" },
      { from: "API", to: "Database", type: "CRUD queries" },
      { from: "Frontend", to: "Auth", type: "login/signup" },
      { from: "API", to: "Auth", type: "token validation" },
    ],
  };
}

function groupProjectsByTime(projects: Project[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOf7Days = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const today: Project[] = [];
  const last7: Project[] = [];
  const lastMonth: Project[] = [];
  const older: Project[] = [];

  for (const p of projects) {
    const d = p.createdAt;
    if (d >= startOfToday) today.push(p);
    else if (d >= startOf7Days) last7.push(p);
    else if (d >= startOfMonth) lastMonth.push(p);
    else older.push(p);
  }

  return { today, last7, lastMonth, older };
}

const STATUS_COLORS: Record<Project["status"], string> = {
  draft: "bg-amber-400/15 text-amber-300 border-amber-400/25",
  "in-progress": "bg-blue-400/15 text-blue-300 border-blue-400/25",
  completed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
};
const STATUS_LABELS: Record<Project["status"], string> = {
  draft: "Entwurf",
  "in-progress": "In Arbeit",
  completed: "Abgeschlossen",
};

const TECH_COLORS: Record<string, string> = {
  "Next.js": "bg-slate-700 text-slate-200",
  React: "bg-cyan-900/60 text-cyan-300",
  "Node.js": "bg-green-900/60 text-green-300",
  PostgreSQL: "bg-blue-900/60 text-blue-300",
  Firebase: "bg-amber-900/60 text-amber-300",
  Supabase: "bg-emerald-900/60 text-emerald-300",
  Tailwind: "bg-sky-900/60 text-sky-300",
  TypeScript: "bg-blue-800/60 text-blue-200",
  Python: "bg-yellow-900/60 text-yellow-300",
  FastAPI: "bg-teal-900/60 text-teal-300",
  MongoDB: "bg-green-800/60 text-green-200",
  Stripe: "bg-violet-900/60 text-violet-300",
};

function TechBadge({ tech }: { tech: string }) {
  const cls = TECH_COLORS[tech] ?? "bg-slate-700 text-slate-300";
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold ${cls}`}
    >
      {tech}
    </span>
  );
}

function SidebarGroup({
  label,
  items,
}: {
  label: string;
  items: Project[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
        {label}
      </p>
      {items.map((p) => (
        <button
          key={p.id}
          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <LayoutDashboard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
          <span className="line-clamp-2 leading-snug">{p.title}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Abstract SVG placeholder for card background ─────────────────────────────

function AbstractGraph({ seed }: { seed: number }) {
  const hue = (seed * 47) % 360;
  const hue2 = (hue + 120) % 360;
  return (
    <svg
      viewBox="0 0 300 100"
      className="w-full h-full opacity-30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`g${seed}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={`hsl(${hue},70%,60%)`} stopOpacity="0.8" />
          <stop offset="100%" stopColor={`hsl(${hue2},60%,40%)`} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="100" fill={`url(#g${seed})`} />
      {[...Array(5)].map((_, i) => {
        const x1 = ((seed * (i + 3) * 37) % 260) + 20;
        const y1 = ((seed * (i + 1) * 61) % 70) + 15;
        const x2 = ((seed * (i + 7) * 53) % 260) + 20;
        const y2 = ((seed * (i + 2) * 79) % 70) + 15;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`hsl(${hue},80%,70%)`}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        );
      })}
      {[...Array(4)].map((_, i) => {
        const cx = ((seed * (i + 5) * 41) % 260) + 20;
        const cy = ((seed * (i + 3) * 67) % 70) + 15;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={4 + (i % 3) * 2}
            fill={`hsl(${hue2},70%,65%)`}
            fillOpacity="0.7"
          />
        );
      })}
    </svg>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  index,
  onDelete,
}: {
  project: Project;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(project.id);
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/30 hover:shadow-[0_0_24px_rgba(34,211,238,0.08)] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Graph preview */}
      <div className="relative h-24 overflow-hidden bg-slate-800/40">
        <AbstractGraph seed={index + 1} />
        {/* Status badge */}
        <span
          className={`absolute top-3 right-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[project.status]}`}
        >
          {STATUS_LABELS[project.status]}
        </span>

        {/* Hover actions */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => router.push(`/dashboard`)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Graph öffnen
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Löschen
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-100">
            {project.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {project.prompt}
          </p>
        </div>

        {/* Tech stack */}
        {project.techStackArray.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.techStackArray.slice(0, 4).map((tech) => (
              <TechBadge key={tech} tech={tech} />
            ))}
            {project.techStackArray.length > 4 && (
              <span className="inline-flex h-6 items-center rounded-full bg-slate-700/60 px-2.5 text-[10px] text-slate-400">
                +{project.techStackArray.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-600">
            {project.componentCount > 0 ? `${project.componentCount} Komponenten` : "Neu"}
          </span>
          <span className="text-[11px] text-slate-600">
            {project.createdAt.toLocaleDateString("de-AT", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  projects,
  open,
  onClose,
  searchQuery,
  onSearchChange,
}: {
  projects: Project[];
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStackArray.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const grouped = groupProjectsByTime(filtered);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/6 bg-slate-950/90 backdrop-blur-xl transition-transform duration-300
          lg:static lg:z-auto lg:translate-x-0 lg:bg-transparent
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Venator" width={28} height={28} className="rounded-lg" />
            <span className="text-sm font-semibold text-slate-200">Venator</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:text-slate-300 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="text"
              placeholder="Projekte suchen…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {projects.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-600">
              Noch keine Projekte
            </p>
          ) : (
            <>
              <SidebarGroup label="Heute" items={grouped.today} />
              <SidebarGroup label="Letzte 7 Tage" items={grouped.last7} />
              <SidebarGroup label="Letzter Monat" items={grouped.lastMonth} />
              <SidebarGroup label="Älter" items={grouped.older} />
            </>
          )}
        </div>
      </aside>
    </>
  );
}


// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const firebaseConfigured = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ].every((value) => typeof value === "string" && value.trim().length > 0);

  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatingJson, setGeneratingJson] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [requestTrace, setRequestTrace] = useState("");
  const [graphNodes, setGraphNodes] = useState<ArchitectureNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ArchitectureEdge[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentInput | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [renderVersion, setRenderVersion] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router, firebaseConfigured]);

  // Subscribe to Firestore projects
  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const unsub = subscribeToProjects(user.uid, setProjects);
    return unsub;
  }, [user, firebaseConfigured]);

  const normalizeAiArchitecture = useCallback((jsonText: string): ArchitectureInput | null => {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      const rawComponents = Array.isArray(parsed.components) ? parsed.components : [];
      const rawConnections = Array.isArray(parsed.connections) ? parsed.connections : [];

      if (rawComponents.length === 0) {
        return null;
      }

      const components = rawComponents.map((component, index) => {
        const obj = typeof component === "object" && component !== null
          ? (component as Record<string, unknown>)
          : {};

        const nameRaw = typeof obj.name === "string" ? obj.name.trim() : "";
        const techRaw = typeof obj.tech === "string" ? obj.tech.trim() : "";
        const reasonRaw = typeof obj.reason === "string" ? obj.reason.trim() : "";

        const alternatives = Array.isArray(obj.alternatives)
          ? obj.alternatives.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
          : [];

        const risks = Array.isArray(obj.risks)
          ? obj.risks.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
          : [];

        return {
          name: nameRaw || `Component ${index + 1}`,
          tech: techRaw || "Unknown Tech",
          reason: reasonRaw.length >= 8 ? reasonRaw : "AI recommendation for this component.",
          alternatives,
          risks,
        };
      });

      const componentNames = new Set(components.map((c) => c.name));

      let connections = rawConnections
        .map((connection) => {
          const obj = typeof connection === "object" && connection !== null
            ? (connection as Record<string, unknown>)
            : {};

          const from = typeof obj.from === "string" ? obj.from.trim() : "";
          const to = typeof obj.to === "string" ? obj.to.trim() : "";
          const type = typeof obj.type === "string" ? obj.type.trim() : "";

          return {
            from,
            to,
            type: type || "data flow",
          };
        })
        .filter((c) => c.from && c.to && c.from !== c.to)
        .filter((c) => componentNames.has(c.from) && componentNames.has(c.to));

      if (components.length > 1 && connections.length === 0) {
        connections = components.slice(0, -1).map((component, index) => ({
          from: component.name,
          to: components[index + 1].name,
          type: "data flow",
        }));
      }

      return {
        components,
        connections,
      };
    } catch {
      return null;
    }
  }, []);

  const buildGraphFromJson = useCallback(
    (jsonText: string) => {
      const parsedResult = parseArchitectureJson(jsonText);
      const architectureInput = parsedResult.ok
        ? parsedResult.data
        : normalizeAiArchitecture(jsonText);

      if (!architectureInput) {
        console.error("[GraphBuild] Failed to parse/normalize JSON for graph generation");
        setGenerateError(parsedResult.ok ? "Graph konnte nicht erstellt werden." : parsedResult.error);
        return false;
      }

      const nextRenderVersion = renderVersion + 1;
      const transformed = transformArchitectureToGraph(architectureInput, nextRenderVersion);
      const layouted = layoutGraph(transformed.nodes, transformed.edges, "LR");

      setRenderVersion(nextRenderVersion);
      setGraphNodes(layouted.nodes);
      setGraphEdges(layouted.edges);
      setGenerateError("");
      console.log("[GraphBuild] Graph generated", {
        nodes: layouted.nodes.length,
        edges: layouted.edges.length,
        renderVersion: nextRenderVersion,
      });

      return true;
    },
    [renderVersion, normalizeAiArchitecture],
  );

  const buildGraphFromArchitecture = useCallback(
    (input: ArchitectureInput) => {
      const nextRenderVersion = renderVersion + 1;
      const transformed = transformArchitectureToGraph(input, nextRenderVersion);
      const layouted = layoutGraph(transformed.nodes, transformed.edges, "LR");

      setRenderVersion(nextRenderVersion);
      setGraphNodes(layouted.nodes);
      setGraphEdges(layouted.edges);
      setGenerateError("");
      console.log("[GraphBuild] Fallback graph generated", {
        nodes: layouted.nodes.length,
        edges: layouted.edges.length,
        renderVersion: nextRenderVersion,
      });
    },
    [renderVersion],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const idea = prompt.trim();

      if (!idea) {
        setGenerateError("Bitte gib zuerst eine Idee ein.");
        setRequestTrace("Kein POST gesendet: Eingabe ist leer.");
        return;
      }

      if (submitting || generatingJson) {
        setRequestTrace("Kein neuer POST: Anfrage laeuft bereits.");
        return;
      }

      console.log("[DashboardSubmit] Submit started", {
        ideaLength: idea.length,
        userId: user?.uid ?? "guest",
      });

      setSubmitting(true);
      setGeneratingJson(true);
      setGenerateError("");
      setRequestTrace("POST /api/ai/generate-json wird gesendet...");
      setSelectedComponent(null);
      setDetailsOpen(false);

      try {
        // Get Firebase ID token for auth + credit check
        let idToken: string | undefined;
        if (user && auth?.currentUser) {
          idToken = await getIdToken(auth.currentUser, /* forceRefresh */ false).catch(() => undefined);
        }

        const response = await fetch("/api/ai/generate-json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ idea }),
        });

        const responseRequestId = response.headers.get("x-request-id") ?? "n/a";
        console.log("[DashboardSubmit] AI route response status", response.status);
        console.log("[DashboardSubmit] AI route request id", responseRequestId);
        setRequestTrace(
          `POST erfolgreich gesendet. HTTP ${response.status}. Request-ID: ${responseRequestId}`,
        );

        const data = (await response.json()) as {
          jsonText?: string;
          error?: string;
          requestId?: string;
        };

        const requestId = data.requestId ?? responseRequestId;

        if (response.status === 402) {
          setGenerateError(
            `Nicht genug Credits. Bitte lade dein Guthaben auf, um fortzufahren.`,
          );
          setRequestTrace("Aufladen unter /buy-credits");
          return;
        }

        if (!response.ok || !data.jsonText) {
          console.error("[DashboardSubmit] AI route failed", data.error ?? "Unknown error");
          buildGraphFromArchitecture(buildLocalFallbackArchitecture(idea));
          setGenerateError(
            `KI-Antwort fehlgeschlagen (Request-ID: ${requestId}). Fallback-Graph wurde lokal erstellt.`,
          );
          return;
        }

        const graphBuilt = buildGraphFromJson(data.jsonText);

        if (graphBuilt) {
          setPrompt("");

          if (firebaseConfigured && user) {
            void createProject({
              userId: user.uid,
              title: generateTitle(idea),
              prompt: idea,
              status: "draft",
              techStackArray: [],
              componentCount: 0,
            }).catch((persistError) => {
              console.warn("[DashboardSubmit] Draft save failed (non-blocking)", persistError);
            });
          }
        } else {
          buildGraphFromArchitecture(buildLocalFallbackArchitecture(idea));
          setGenerateError(
            "KI-JSON war ungueltig. Fallback-Graph wurde lokal erstellt.",
          );
        }
      } catch (error) {
        console.error("[DashboardSubmit] Unexpected submit error", error);
        setRequestTrace("POST fehlgeschlagen vor Antwort (Netzwerk/Blocker/CORS).");
        buildGraphFromArchitecture(buildLocalFallbackArchitecture(idea));
        setGenerateError("Die Anfrage ist fehlgeschlagen. Fallback-Graph wurde lokal erstellt.");
      } finally {
        setGeneratingJson(false);
        setSubmitting(false);
        console.log("[DashboardSubmit] Submit finished");
      }
    },
    [
      prompt,
      user,
      submitting,
      generatingJson,
      firebaseConfigured,
      buildGraphFromJson,
      buildGraphFromArchitecture,
    ],
  );

  const handleDelete = useCallback(async (id: string) => {
    await deleteProject(id);
  }, []);

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  const displayName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar
        projects={projects}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <DashboardHeader />

        {/* Hero — vertically centered prompt */}
        <section className="relative flex min-h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center overflow-hidden px-4">
          {/* Animated background shapes — full width */}
          <ElegantShape
            delay={0.3}
            width={500}
            height={120}
            rotate={12}
            gradient="from-cyan-500/[0.12]"
            className="left-[-4%] top-[10%] pointer-events-none"
          />
          <ElegantShape
            delay={0.5}
            width={400}
            height={100}
            rotate={-15}
            gradient="from-fuchsia-500/[0.12]"
            className="right-[-2%] bottom-[15%] pointer-events-none"
          />
          <ElegantShape
            delay={0.4}
            width={250}
            height={70}
            rotate={-8}
            gradient="from-indigo-500/[0.12]"
            className="left-[5%] bottom-[5%] pointer-events-none"
          />
          <ElegantShape
            delay={0.6}
            width={180}
            height={50}
            rotate={20}
            gradient="from-violet-500/[0.12]"
            className="right-[18%] top-[5%] pointer-events-none"
          />
          <ElegantShape
            delay={0.7}
            width={130}
            height={38}
            rotate={-25}
            gradient="from-sky-500/[0.12]"
            className="left-[22%] top-[2%] pointer-events-none"
          />

          <div className="relative z-10 w-full max-w-3xl">
            <VercelV0Chat
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => void handleSubmit()}
              submitting={submitting || generatingJson}
              displayName={displayName}
            />

            {(submitting || generatingJson) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                KI generiert Architektur-JSON und baut den Graph…
              </div>
            )}

            {generateError && (
              <div className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200 flex items-center justify-between gap-3">
                <span>{generateError}</span>
                {generateError.includes("Credits") && (
                  <a
                    href="/buy-credits"
                    className="shrink-0 rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                  >
                    Guthaben aufladen
                  </a>
                )}
              </div>
            )}

            {requestTrace && (
              <div className="mt-3 rounded-xl border border-slate-500/30 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                {requestTrace}
              </div>
            )}
          </div>
        </section>

        {/* Graph — visible on scroll */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-12">
          <div className="h-[760px] w-full">
            <GraphCanvas
              nodes={graphNodes}
              edges={graphEdges}
              isLoading={submitting || generatingJson}
              onNodeSelect={handleNodeSelect}
              onGenerate={() => void handleSubmit()}
            />
          </div>
        </section>

        <ComponentDetailsSheet
          component={selectedComponent}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />

        {/* Project grid */}
        {projects.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 pb-12 lg:px-6">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-400">
                Deine Projekte
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                {projects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {projects.length === 0 && !authLoading && (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-slate-800/60">
              <Plus className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-600">
              Noch keine Projekte. Beschreibe deine Idee oben!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
