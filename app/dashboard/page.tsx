"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import { subscribeToProjects, createProject } from "@/lib/firebase/projects";
import type { Project } from "@/types/project";
import type { ArchitectureComponentInput, ArchitectureEdge, ArchitectureNode } from "@/types/architecture";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { parseArchitectureJson, transformArchitectureToGraph } from "@/lib/graph/transform";
import { layoutGraph } from "@/lib/graph/layout";
import { cn } from "@/lib/utils";

type PageState = "idle" | "submitting" | "graph-ready";

function generateTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 37) + "…";
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");

  // Context modal
  const [modalOpen, setModalOpen] = useState(false);
  const [projectType, setProjectType] = useState("web-app");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [budgetLevel, setBudgetLevel] = useState("free");

  // Graph state
  const [pageState, setPageState] = useState<PageState>("idle");
  const [graphNodes, setGraphNodes] = useState<ArchitectureNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ArchitectureEdge[]>([]);
  const [graphContainerOpen, setGraphContainerOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentInput | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router, firebaseConfigured]);

  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const unsub = subscribeToProjects(user.uid, setProjects);
    return unsub;
  }, [user, firebaseConfigured]);

  // Animate graph container in after graph-ready
  useEffect(() => {
    if (pageState !== "graph-ready") {
      setGraphContainerOpen(false);
      return;
    }
    const t = window.setTimeout(() => setGraphContainerOpen(true), 40);
    return () => window.clearTimeout(t);
  }, [pageState]);

  const normalizeAiArchitecture = useCallback((jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      const rawComponents = Array.isArray(parsed.components) ? parsed.components : [];
      const rawConnections = Array.isArray(parsed.connections) ? parsed.connections : [];
      if (rawComponents.length === 0) return null;
      const components = rawComponents.map((component, index) => {
        const obj = typeof component === "object" && component !== null ? (component as Record<string, unknown>) : {};
        const alternatives = Array.isArray(obj.alternatives) ? obj.alternatives.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean) : [];
        const risks = Array.isArray(obj.risks) ? obj.risks.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean) : [];
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
      let connections = rawConnections.map((c) => { const obj = typeof c === "object" && c !== null ? (c as Record<string, unknown>) : {}; return { from: typeof obj.from === "string" ? obj.from.trim() : "", to: typeof obj.to === "string" ? obj.to.trim() : "", type: typeof obj.type === "string" ? obj.type.trim() : "data flow" }; }).filter((c) => c.from && c.to && c.from !== c.to && componentNames.has(c.from) && componentNames.has(c.to));
      if (components.length > 1 && connections.length === 0) {
        connections = components.slice(0, -1).map((c, i) => ({ from: c.name, to: components[i + 1].name, type: "data flow" }));
      }
      return { components, connections };
    } catch { return null; }
  }, []);

  // Called by the chat send button — just opens the context modal
  const handleOpenModal = useCallback(() => {
    if (!prompt.trim()) return;
    setGenerateError("");
    setModalOpen(true);
  }, [prompt]);

  // Called by the modal confirm button — runs the actual API
  const handleAnalyze = useCallback(async () => {
    const idea = prompt.trim();
    if (!idea) return;

    setModalOpen(false);
    setPageState("submitting");
    setGenerateError("");
    setGraphNodes([]);
    setGraphEdges([]);
    setSelectedComponent(null);
    setDetailsOpen(false);

    try {
      let idToken: string | undefined;
      if (user && auth?.currentUser) {
        idToken = await getIdToken(auth.currentUser, false).catch(() => undefined);
      }

      const response = await fetch("/api/ai/generate-json", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ idea, projectType, experienceLevel, budgetLevel }),
      });

      const data = (await response.json()) as { jsonText?: string; error?: string };

      if (response.status === 402) {
        setPageState("idle");
        setGenerateError("Nicht genug Credits. Bitte lade dein Guthaben auf.");
        return;
      }
      if (!response.ok || !data.jsonText) {
        setPageState("idle");
        setGenerateError(data.error ?? "KI-Antwort fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }

      const parsedResult = parseArchitectureJson(data.jsonText);
      const architectureInput = parsedResult.ok ? parsedResult.data : normalizeAiArchitecture(data.jsonText);

      if (!architectureInput) {
        setPageState("idle");
        setGenerateError(parsedResult.ok ? "Graph konnte nicht erstellt werden." : parsedResult.error);
        return;
      }

      const transformed = transformArchitectureToGraph(architectureInput, 1);
      const layouted = layoutGraph(transformed.nodes, transformed.edges, "LR");
      setGraphNodes(layouted.nodes);
      setGraphEdges(layouted.edges);

      const title = generateTitle(idea);
      setProjectTitle(title);
      setPageState("graph-ready");

      if (firebaseConfigured && user) {
        void createProject({
          userId: user.uid,
          title,
          prompt: idea,
          status: "draft",
          techStackArray: architectureInput.components.map((c) => c.tech),
          componentCount: architectureInput.components.length,
          architectureJson: data.jsonText,
        }).catch((err) => console.warn("[Dashboard] Save failed (non-blocking)", err));
      }
    } catch (error) {
      console.error("[Dashboard] Submit error", error);
      setPageState("idle");
      setGenerateError("Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen.");
    }
  }, [prompt, projectType, experienceLevel, budgetLevel, user, firebaseConfigured, normalizeAiArchitecture]);

  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setModalOpen(false);
  }, []);

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  const displayName =
    firstName ||
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <SidebarProvider className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <AppSidebar
        projects={projects}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <SidebarInset className="bg-slate-950 text-slate-100">
        <DashboardHeader />

        {/* ── IDLE / SUBMITTING: centered prompt ─────────────────────────────── */}
        {(pageState === "idle" || pageState === "submitting") && (
          <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
            <ElegantShape
              delay={0.3}
              width={500}
              height={120}
              rotate={12}
              gradient="from-cyan-500/[0.12]"
              className="pointer-events-none left-[-4%] top-[10%]"
            />
            <ElegantShape
              delay={0.5}
              width={400}
              height={100}
              rotate={-15}
              gradient="from-fuchsia-500/[0.12]"
              className="pointer-events-none right-[-2%] bottom-[15%]"
            />
            <ElegantShape
              delay={0.4}
              width={250}
              height={70}
              rotate={-8}
              gradient="from-indigo-500/[0.12]"
              className="pointer-events-none left-[5%] bottom-[5%]"
            />
            <ElegantShape
              delay={0.6}
              width={180}
              height={50}
              rotate={20}
              gradient="from-violet-500/[0.12]"
              className="pointer-events-none right-[18%] top-[5%]"
            />
            <ElegantShape
              delay={0.7}
              width={130}
              height={38}
              rotate={-25}
              gradient="from-sky-500/[0.12]"
              className="pointer-events-none left-[22%] top-[2%]"
            />

            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-4">
              <VercelV0Chat
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleOpenModal}
                submitting={pageState === "submitting"}
                displayName={displayName}
              />

              {/* Loading indicator */}
              {pageState === "submitting" && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  KI analysiert dein Projekt…
                </div>
              )}

              {/* Error */}
              {generateError && pageState === "idle" && (
                <div className="w-full rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {generateError}
                  {generateError.includes("Credits") && (
                    <a href="/buy-credits" className="ml-2 underline text-cyan-400 hover:text-cyan-300">
                      Guthaben aufladen
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── CONTEXT MODAL ───────────────────────────────────────────────────── */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onKeyDown={handleModalKeyDown}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            {/* Modal card */}
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
              <h2 className="mb-1 text-lg font-semibold text-slate-50">Projekt spezialisieren</h2>
              <p className="mb-5 text-sm text-slate-500">
                Ein paar Details helfen der KI, bessere Empfehlungen zu geben.
              </p>

              <div className="flex flex-col gap-5">
                {/* Project type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Projekttyp</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/50 focus:bg-slate-800 cursor-pointer"
                  >
                    <option value="web-app">Web App</option>
                    <option value="mobile">Mobile App</option>
                    <option value="api">API / Backend</option>
                    <option value="saas">SaaS Produkt</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>

                {/* Experience level */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Erfahrungslevel</label>
                  <div className="flex gap-2">
                    {[
                      { value: "beginner", label: "Anfänger" },
                      { value: "junior", label: "Junior" },
                      { value: "mid", label: "Mid" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExperienceLevel(opt.value)}
                        className={cn(
                          "flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all",
                          experienceLevel === opt.value
                            ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                            : "border-white/8 bg-white/4 text-slate-500 hover:border-white/15 hover:text-slate-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-400">Budget-Rahmen</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "free", label: "Kostenlos", sub: "Free Tier / Open-Source" },
                      { value: "low", label: "Niedrig", sub: "< 20 € / Monat" },
                      { value: "medium", label: "Mittel", sub: "20–100 € / Monat" },
                      { value: "high", label: "Hoch", sub: "> 100 € / Monat" },
                    ].map((opt) => {
                      const active = budgetLevel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBudgetLevel(opt.value)}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                            active
                              ? "border-cyan-400/60 bg-cyan-500/15"
                              : "border-white/8 bg-white/4 hover:border-white/15"
                          )}
                        >
                          <span className={cn(
                            "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            active ? "border-cyan-400 bg-cyan-400" : "border-slate-600 bg-transparent"
                          )}>
                            {active && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                          </span>
                          <span className="flex flex-col">
                            <span className={cn("text-xs font-medium", active ? "text-cyan-300" : "text-slate-300")}>
                              {opt.label}
                            </span>
                            <span className="text-[11px] text-slate-600">{opt.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => void handleAnalyze()}
                  className="flex-1 rounded-xl border border-cyan-400/50 bg-cyan-500/20 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/70 hover:bg-cyan-500/30"
                >
                  Analyse starten →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── GRAPH PHASE ─────────────────────────────────────────────────────── */}
        {pageState === "graph-ready" && (
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Architektur für</p>
                <h2 className="text-lg font-semibold text-slate-100">{projectTitle}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setPageState("idle"); setGenerateError(""); }}
                className="rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
              >
                ← Neu erstellen
              </button>
            </div>

            <div className={cn(
              "min-h-0 flex-1 flex flex-col overflow-hidden rounded-2xl transition-all duration-700 ease-out",
              graphContainerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              {graphNodes.length > 0 ? (
                <GraphCanvas
                  nodes={graphNodes}
                  edges={graphEdges}
                  onNodeSelect={handleNodeSelect}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60 text-sm text-slate-300">
                  Graph wird geladen…
                </div>
              )}
            </div>
          </main>
        )}
      </SidebarInset>

      <ComponentDetailsSheet
        component={selectedComponent}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </SidebarProvider>
  );
}
