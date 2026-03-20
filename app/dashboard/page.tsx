"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GitBranch,
  LayoutDashboard,
  Loader2,
  Menu,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createProject,
  deleteProject,
  subscribeToProjects,
} from "@/lib/firebase/projects";
import type { Project } from "@/types/project";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 37) + "…";
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

  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Subscribe to Firestore projects
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToProjects(user.uid, setProjects);
    return unsub;
  }, [user]);


  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!prompt.trim() || !user || submitting) return;

      setSubmitting(true);
      try {
        await createProject({
          userId: user.uid,
          title: generateTitle(prompt),
          prompt: prompt.trim(),
          status: "draft",
          techStackArray: [],
          componentCount: 0,
        });
        setPrompt("");
      } finally {
        setSubmitting(false);
      }
    },
    [prompt, user, submitting],
  );

  const handleDelete = useCallback(async (id: string) => {
    await deleteProject(id);
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
        <header className="flex shrink-0 items-center justify-between border-b border-white/6 px-4 py-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <Wrench className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-500">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
              {displayName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Hero — Start-First */}
        <section className="mx-auto w-full max-w-3xl px-4 py-12 lg:py-16">
          <VercelV0Chat
            value={prompt}
            onChange={setPrompt}
            onSubmit={() => void handleSubmit()}
            submitting={submitting}
            displayName={displayName}
          />
        </section>

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
