"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import { createProject } from "@/lib/firebase/projects";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTitle(prompt: string): string {
  const t = prompt.trim();
  return t.length <= 40 ? t : t.slice(0, 37) + "…";
}

type PageState = "form" | "submitting" | "graph-ready";

// ─── Main form component ───────────────────────────────────────────────────────

function NewProjectForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [description, setDescription] = useState(searchParams.get("q") ?? "");
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("web-app");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [budgetLevel, setBudgetLevel] = useState<string[]>(["free"]);
  const [pageState, setPageState] = useState<PageState>("form");
  const [generateError, setGenerateError] = useState("");
  const [graphNodes, setGraphNodes] = useState<ArchitectureNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ArchitectureEdge[]>([]);
  const [graphReady, setGraphReady] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponentInput | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");

  const firebaseConfigured = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ].every((v) => typeof v === "string" && v.trim().length > 0);

  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router, firebaseConfigured]);

  useEffect(() => {
    if (pageState !== "graph-ready") { setGraphReady(false); return; }
    const t = window.setTimeout(() => setGraphReady(true), 40);
    return () => window.clearTimeout(t);
  }, [pageState]);

  const toggleBudget = (value: string) =>
    setBudgetLevel((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const normalizeAi = useCallback((jsonText: string): ArchitectureInput | null => {
    try {
      const p = JSON.parse(jsonText) as Record<string, unknown>;
      const rawC = Array.isArray(p.components) ? p.components : [];
      if (rawC.length === 0) return null;
      const components = rawC.map((c, i) => {
        const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
        const reason = typeof o.reason === "string" ? o.reason.trim() : "";
        return {
          name: typeof o.name === "string" ? o.name.trim() : `Component ${i + 1}`,
          tech: typeof o.tech === "string" ? o.tech.trim() : "Unknown",
          reason: reason.length >= 8 ? reason : "AI recommendation.",
          alternatives: Array.isArray(o.alternatives) ? o.alternatives.filter((v): v is string => typeof v === "string") : [],
          risks: Array.isArray(o.risks) ? o.risks.filter((v): v is string => typeof v === "string") : [],
        };
      });
      const names = new Set(components.map((c) => c.name));
      const rawConn = Array.isArray(p.connections) ? p.connections : [];
      let connections = rawConn
        .map((c) => {
          const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
          return { from: String(o.from ?? "").trim(), to: String(o.to ?? "").trim(), type: String(o.type ?? "data flow").trim() };
        })
        .filter((c) => c.from && c.to && c.from !== c.to && names.has(c.from) && names.has(c.to));
      if (components.length > 1 && connections.length === 0)
        connections = components.slice(0, -1).map((c, i) => ({ from: c.name, to: components[i + 1].name, type: "data flow" }));
      return { components, connections };
    } catch { return null; }
  }, []);

  const handleAnalyze = async () => {
    const idea = description.trim();
    if (!idea) { setGenerateError("Bitte gib zuerst eine Projektbeschreibung ein."); return; }

    setPageState("submitting");
    setGenerateError("");

    try {
      let idToken: string | undefined;
      if (user && auth?.currentUser)
        idToken = await getIdToken(auth.currentUser, false).catch(() => undefined);

      const res = await fetch("/api/ai/generate-json", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ idea }),
      });

      const data = (await res.json()) as { jsonText?: string; error?: string };

      if (res.status === 402) {
        setPageState("form");
        setGenerateError("Nicht genug Credits. Bitte lade dein Guthaben auf.");
        return;
      }
      if (!res.ok || !data.jsonText) {
        setPageState("form");
        setGenerateError(data.error ?? "KI-Antwort fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }

      const parsed = parseArchitectureJson(data.jsonText);
      const arch = parsed.ok ? parsed.data : normalizeAi(data.jsonText);
      if (!arch) { setPageState("form"); setGenerateError(parsed.ok ? "Graph konnte nicht erstellt werden." : parsed.error); return; }

      const transformed = transformArchitectureToGraph(arch, 1);
      const { nodes, edges } = layoutGraph(transformed.nodes, transformed.edges, "LR");
      setGraphNodes(nodes);
      setGraphEdges(edges);

      const title = projectName.trim() || generateTitle(idea);
      setProjectTitle(title);
      setPageState("graph-ready");

      if (firebaseConfigured && user)
        void createProject({ userId: user.uid, title, prompt: idea, status: "draft", techStackArray: arch.components.map((c) => c.tech), componentCount: arch.components.length, architectureJson: data.jsonText })
          .catch((e) => console.warn("[NewProject] save failed", e));
    } catch {
      setPageState("form");
      setGenerateError("Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <DashboardHeader />

      {/* ── FORM ─────────────────────────────────────────────────────────────── */}
      {pageState === "form" && (
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Zurück
          </Link>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-50">Neues Projekt</h1>
          <p className="mb-8 text-sm text-slate-500">Beschreibe dein Projekt — die KI empfiehlt dir die passende Architektur.</p>

          <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Projektbeschreibung <span className="text-red-400">*</span></label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibe deine App-Idee so detailliert wie möglich…"
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none transition-colors focus:border-cyan-400/50 focus:bg-slate-800"
              />
            </div>

            {/* Project name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Projektname <span className="text-slate-600">(optional)</span></label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="z. B. Mein Fahrrad-Marktplatz"
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-400/50 focus:bg-slate-800"
              />
            </div>

            {/* Type + Experience */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Projekttyp</label>
                <select value={projectType} onChange={(e) => setProjectType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 cursor-pointer outline-none transition-colors focus:border-cyan-400/50">
                  <option value="web-app">Web App</option>
                  <option value="mobile">Mobile App</option>
                  <option value="api">API / Backend</option>
                  <option value="saas">SaaS Produkt</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Erfahrungslevel</label>
                <div className="flex gap-2">
                  {[{ v: "beginner", l: "Anfänger" }, { v: "junior", l: "Junior" }, { v: "mid", l: "Mid" }].map((o) => (
                    <button key={o.v} type="button" onClick={() => setExperienceLevel(o.v)}
                      className={cn("flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all",
                        experienceLevel === o.v ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300" : "border-white/8 bg-white/4 text-slate-500 hover:border-white/15 hover:text-slate-300")}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Budget-Rahmen <span className="text-slate-600">(Mehrfachauswahl)</span></label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "free", l: "Kostenlos", s: "Free Tier / Open-Source" },
                  { v: "low", l: "Niedrig", s: "< 20 € / Monat" },
                  { v: "medium", l: "Mittel", s: "20–100 € / Monat" },
                  { v: "high", l: "Hoch", s: "> 100 € / Monat" },
                ].map((o) => {
                  const active = budgetLevel.includes(o.v);
                  return (
                    <button key={o.v} type="button" onClick={() => toggleBudget(o.v)}
                      className={cn("flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                        active ? "border-cyan-400/60 bg-cyan-500/15" : "border-white/8 bg-white/4 hover:border-white/15")}>
                      <span className={cn("mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                        active ? "border-cyan-400 bg-cyan-400" : "border-slate-600")}>
                        {active && <svg className="h-2.5 w-2.5 text-slate-950" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      <span className="flex flex-col">
                        <span className={cn("text-xs font-medium", active ? "text-cyan-300" : "text-slate-300")}>{o.l}</span>
                        <span className="text-[11px] text-slate-600">{o.s}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {generateError && (
              <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {generateError}
                {generateError.includes("Credits") && <a href="/buy-credits" className="ml-2 underline text-cyan-400">Guthaben aufladen</a>}
              </div>
            )}

            <button type="button" onClick={() => void handleAnalyze()} disabled={!description.trim()}
              className={cn("flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
                description.trim() ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:border-cyan-400/70 hover:bg-cyan-500/30" : "cursor-not-allowed border-white/8 bg-white/4 text-slate-600 opacity-50")}>
              Analyse starten <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* ── LOADING ──────────────────────────────────────────────────────────── */}
      {pageState === "submitting" && (
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full border border-cyan-300/35 bg-slate-900/75 p-6 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
            <p className="text-base font-medium text-slate-200">KI analysiert dein Projekt…</p>
            <p className="text-sm text-slate-500">Das dauert ca. 5–10 Sekunden</p>
          </div>
        </main>
      )}

      {/* ── GRAPH ────────────────────────────────────────────────────────────── */}
      {pageState === "graph-ready" && (
        <main className="flex flex-1 flex-col overflow-hidden px-4 pb-6 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Architektur für</p>
              <h2 className="text-lg font-semibold text-slate-100">{projectTitle}</h2>
            </div>
            <button type="button" onClick={() => setPageState("form")}
              className="rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200">
              ← Neu erstellen
            </button>
          </div>
          <div className={cn("flex-1 overflow-hidden rounded-2xl transition-all duration-700",
            graphReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
            {graphReady && graphNodes.length > 0
              ? <GraphCanvas nodes={graphNodes} edges={graphEdges} onNodeSelect={(c) => { setSelectedComponent(c); setDetailsOpen(true); }} />
              : <div className="flex h-full items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60 text-sm text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird geladen…</div>}
          </div>
        </main>
      )}

      <ComponentDetailsSheet component={selectedComponent} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
}

// ─── Page export with Suspense (required for useSearchParams) ─────────────────

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    }>
      <NewProjectForm />
    </Suspense>
  );
}
