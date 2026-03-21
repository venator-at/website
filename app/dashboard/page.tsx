"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import {
  createProject,
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

type DashboardUiState = "idle" | "submitting" | "loading" | "graph-ready";

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
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

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
          {ordered.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-600">
              Noch keine Projekte
            </p>
          ) : (
            ordered.map((project) => (
              <button
                key={project.id}
                className="mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
              >
                <LayoutDashboard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                <span className="line-clamp-2 leading-snug">{project.title}</span>
              </button>
            ))
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
  const [uiState, setUiState] = useState<DashboardUiState>("idle");
  const [generateError, setGenerateError] = useState("");
  const [requestTrace, setRequestTrace] = useState("");
  const [graphNodes, setGraphNodes] = useState<ArchitectureNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ArchitectureEdge[]>([]);
  const [pendingArchitecture, setPendingArchitecture] = useState<ArchitectureInput | null>(null);
  const [graphContainerOpen, setGraphContainerOpen] = useState(false);
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

  const parseGraphArchitecture = useCallback(
    (jsonText: string): ArchitectureInput | null => {
      const parsedResult = parseArchitectureJson(jsonText);
      const architectureInput = parsedResult.ok
        ? parsedResult.data
        : normalizeAiArchitecture(jsonText);

      if (!architectureInput) {
        console.error("[GraphBuild] Failed to parse/normalize JSON for graph generation");
        setGenerateError(parsedResult.ok ? "Graph konnte nicht erstellt werden." : parsedResult.error);
        return null;
      }

      return architectureInput;
    },
    [normalizeAiArchitecture],
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
      console.log("[GraphBuild] Graph generated", {
        nodes: layouted.nodes.length,
        edges: layouted.edges.length,
        renderVersion: nextRenderVersion,
      });
    },
    [renderVersion],
  );

  useEffect(() => {
    if (uiState !== "graph-ready" || !graphContainerOpen || !pendingArchitecture) {
      return;
    }

    buildGraphFromArchitecture(pendingArchitecture);
    setPendingArchitecture(null);
  }, [uiState, graphContainerOpen, pendingArchitecture, buildGraphFromArchitecture]);

  useEffect(() => {
    if (uiState !== "graph-ready") {
      setGraphContainerOpen(false);
      return;
    }

    const openTimer = window.setTimeout(() => {
      setGraphContainerOpen(true);
    }, 40);

    return () => {
      window.clearTimeout(openTimer);
    };
  }, [uiState]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const idea = prompt.trim();
      const isBusy = uiState === "submitting" || uiState === "loading";

      if (!idea) {
        setGenerateError("Bitte gib zuerst eine Idee ein.");
        setRequestTrace("Kein POST gesendet: Eingabe ist leer.");
        return;
      }

      if (isBusy) {
        setRequestTrace("Kein neuer POST: Anfrage laeuft bereits.");
        return;
      }

      console.log("[DashboardSubmit] Submit started", {
        ideaLength: idea.length,
        userId: user?.uid ?? "guest",
      });

      const loadingStateTimer = window.setTimeout(() => {
        setUiState((current) => (current === "submitting" ? "loading" : current));
      }, 520);

      setUiState("submitting");
      setGraphContainerOpen(false);
      setPendingArchitecture(null);
      setGraphNodes([]);
      setGraphEdges([]);
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
          setUiState("idle");
          setGenerateError(
            `Nicht genug Credits. Bitte lade dein Guthaben auf, um fortzufahren.`,
          );
          setRequestTrace("Aufladen unter /buy-credits");
          return;
        }

        if (!response.ok || !data.jsonText) {
          console.error("[DashboardSubmit] AI route failed", data.error ?? "Unknown error");
          setUiState("idle");
          setGenerateError(
            `KI-Antwort fehlgeschlagen (Request-ID: ${requestId}). Bitte erneut versuchen.`,
          );
          return;
        }

        const architectureInput = parseGraphArchitecture(data.jsonText);

        if (!architectureInput) {
          setUiState("idle");
          return;
        }

        setPendingArchitecture(architectureInput);
        setPrompt("");
        setUiState("graph-ready");

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
      } catch (error) {
        console.error("[DashboardSubmit] Unexpected submit error", error);
        setRequestTrace("POST fehlgeschlagen vor Antwort (Netzwerk/Blocker/CORS).");
        setGenerateError("Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen.");
        setUiState("idle");
      } finally {
        window.clearTimeout(loadingStateTimer);
        console.log("[DashboardSubmit] Submit finished");
      }
    },
    [
      prompt,
      user,
      uiState,
      firebaseConfigured,
      parseGraphArchitecture,
    ],
  );

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  const displayName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const isBusy = uiState === "submitting" || uiState === "loading";
  const showGraphContainer = uiState === "graph-ready";

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
        {/* Top bar */}
        <DashboardHeader />

        <section className="relative mx-auto h-full w-full max-w-6xl overflow-visible px-4 pb-10 pt-4 lg:pt-6">
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

          <div
            className={`pointer-events-none absolute left-0 right-0 z-20 mx-auto w-full max-w-3xl transform px-4 transition-all duration-700 ease-out lg:px-0 ${
              uiState === "idle"
                ? "top-1/2 -translate-y-1/2"
                : "bottom-6 translate-y-0"
            }`}
          >
            <div className="pointer-events-auto">
            <VercelV0Chat
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => void handleSubmit()}
              submitting={isBusy}
              displayName={displayName}
            />
            </div>

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

          {uiState === "idle" && (
            <div className="pointer-events-none absolute left-1/2 top-[67%] z-10 w-full max-w-3xl -translate-x-1/2 px-4 text-center text-sm text-slate-400 lg:px-0">
              your graph will appear here
            </div>
          )}

          {isBusy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-full border border-cyan-300/35 bg-slate-900/75 p-5 backdrop-blur-sm">
                <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
              </div>
            </div>
          )}

          {showGraphContainer && (
            <div
              className={`absolute inset-0 z-0 flex items-center justify-center px-1 pb-28 pt-6 transition-all duration-700 ease-out ${
                graphContainerOpen
                  ? "translate-y-0 scale-y-100 opacity-100"
                  : "translate-y-6 scale-y-[0.96] opacity-0"
              }`}
            >
              <div className="h-[640px] w-full overflow-hidden rounded-2xl">
                {graphContainerOpen && graphNodes.length > 0 ? (
                  <GraphCanvas
                    nodes={graphNodes}
                    edges={graphEdges}
                    onNodeSelect={handleNodeSelect}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60 text-sm text-slate-300 backdrop-blur-sm">
                    Generating graph...
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <ComponentDetailsSheet
          component={selectedComponent}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />

      </div>
    </div>
  );
}
