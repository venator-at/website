"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  ArchitectureNode,
} from "@/types/architecture";
import type { Project } from "@/types/project";

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
        if (!p) { setLoadError("Projekt nicht gefunden."); return; }
        if (p.userId !== user.uid) { setLoadError("Kein Zugriff auf dieses Projekt."); return; }
        setProject(p);

        if (!p.architectureJson) { setLoadError("Für dieses Projekt wurde noch keine Architektur generiert."); return; }

        const result = parseArchitectureJson(p.architectureJson);
        if (!result.ok) { setLoadError("Architektur konnte nicht geladen werden."); return; }

        const transformed = transformArchitectureToGraph(result.data, 1);
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

  if (authLoading || (!loaded && !loadError)) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950">
        <DashboardHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="flex flex-1 flex-col overflow-hidden px-4 pb-6 pt-4">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            {project ? (
              <>
                <p className="text-xs text-slate-500">Architektur für</p>
                <h1 className="text-lg font-semibold text-slate-100">{project.title}</h1>
              </>
            ) : (
              <h1 className="text-lg font-semibold text-slate-100">Projekt</h1>
            )}
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Error state */}
        {loadError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-5 py-3 text-sm text-red-200">
              {loadError}
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-500 underline hover:text-slate-300"
            >
              Zurück zum Dashboard
            </Link>
          </div>
        )}

        {/* Graph */}
        {!loadError && (
          <div className={cn(
            "flex-1 overflow-hidden rounded-2xl transition-all duration-700 ease-out",
            graphContainerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {graphContainerOpen && graphNodes.length > 0 ? (
              <GraphCanvas
                nodes={graphNodes}
                edges={graphEdges}
                onNodeSelect={handleNodeSelect}
              />
            ) : (
              !loadError && (
                <div className="flex h-full items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60 text-sm text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Graph wird geladen…
                </div>
              )
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
