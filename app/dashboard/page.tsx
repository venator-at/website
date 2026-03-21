"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, LayoutDashboard, Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToProjects } from "@/lib/firebase/projects";
import type { Project } from "@/types/project";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ElegantShape } from "@/components/ui/shape-landing-hero";

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

  const ordered = [...filtered].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <>
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
          {ordered.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-600">
              Noch keine Projekte
            </p>
          ) : (
            ordered.map((project) => (
              <a
                key={project.id}
                href={`/project/${project.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 group"
              >
                <LayoutDashboard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                <span className="line-clamp-2 flex-1 leading-snug">{project.title}</span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))
          )}
        </div>
      </aside>
    </>
  );
}


// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading, firstName } = useAuth();
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

  // Redirect if not logged in
  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router, firebaseConfigured]);

  // Subscribe to Firestore projects
  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const unsub = subscribeToProjects(user.uid, setProjects);
    return unsub;
  }, [user, firebaseConfigured]);

  // Open new project page in a new tab
  const handleSubmit = useCallback(() => {
    const idea = prompt.trim();
    if (!idea) return;
    window.open(`/new?q=${encodeURIComponent(idea)}`, "_blank");
    setPrompt("");
  }, [prompt]);

  const displayName = firstName || user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";

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
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <section className="relative mx-auto h-full w-full max-w-6xl overflow-visible px-4 pb-10 pt-4 lg:pt-6">
          <ElegantShape delay={0.3} width={500} height={120} rotate={12} gradient="from-cyan-500/[0.12]" className="left-[-4%] top-[10%] pointer-events-none" />
          <ElegantShape delay={0.5} width={400} height={100} rotate={-15} gradient="from-fuchsia-500/[0.12]" className="right-[-2%] bottom-[15%] pointer-events-none" />
          <ElegantShape delay={0.4} width={250} height={70} rotate={-8} gradient="from-indigo-500/[0.12]" className="left-[5%] bottom-[5%] pointer-events-none" />
          <ElegantShape delay={0.6} width={180} height={50} rotate={20} gradient="from-violet-500/[0.12]" className="right-[18%] top-[5%] pointer-events-none" />
          <ElegantShape delay={0.7} width={130} height={38} rotate={-25} gradient="from-sky-500/[0.12]" className="left-[22%] top-[2%] pointer-events-none" />

          {/* Centered input */}
          <div className="absolute left-0 right-0 top-1/2 z-20 mx-auto w-full max-w-3xl -translate-y-1/2 px-4 lg:px-0">
            <VercelV0Chat
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              displayName={displayName}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
