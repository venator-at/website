"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import { subscribeToProjects, createProject } from "@/lib/firebase/projects";
import { subscribeToChats, createChatConversation, updateChatConversation } from "@/lib/firebase/chats";
import type { Project } from "@/types/project";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import type { ArchitectureComponentInput, ArchitectureEdge, ArchitectureNode } from "@/types/architecture";
import { VercelV0Chat, type ChatMode } from "@/components/ui/v0-ai-chat";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { parseArchitectureJson, transformArchitectureToGraph } from "@/lib/graph/transform";
import { layoutGraph } from "@/lib/graph/layout";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
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

  // Chat mode state
  const [chatMode, setChatMode] = useState<ChatMode>("planning");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router, firebaseConfigured]);

  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const unsub = subscribeToProjects(user.uid, setProjects);
    return unsub;
  }, [user, firebaseConfigured]);

  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const unsub = subscribeToChats(user.uid, setChats);
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

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatSubmitting]);

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

  // Called by the chat send button — opens context modal (planning mode)
  const handleOpenModal = useCallback(() => {
    if (!prompt.trim()) return;
    setGenerateError("");
    setModalOpen(true);
  }, [prompt]);

  // Called by the modal confirm button — runs the architecture API
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

  // Called in free text chat mode
  const handleChatSubmit = useCallback(async () => {
    const message = prompt.trim();
    if (!message || chatSubmitting) return;

    setPrompt("");
    setChatError("");
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: "user", text: message }];
    setChatHistory(updatedHistory);
    setChatSubmitting(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = (await response.json()) as { text?: string; error?: string };

      const aiText = (!response.ok || !data.text)
        ? (data.error ?? "Antwort fehlgeschlagen. Bitte erneut versuchen.")
        : data.text!;

      const finalHistory: ChatMessage[] = [...updatedHistory, { role: "ai", text: aiText }];
      setChatHistory(finalHistory);

      // Persist to Firestore
      if (firebaseConfigured && user) {
        if (!currentChatId) {
          const title = message.length <= 40 ? message : message.slice(0, 37) + "…";
          const newId = await createChatConversation({
            userId: user.uid,
            title,
            messages: finalHistory,
          }).catch(() => null);
          if (newId) setCurrentChatId(newId);
        } else {
          void updateChatConversation(currentChatId, finalHistory).catch(() => null);
        }
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen." },
      ]);
    } finally {
      setChatSubmitting(false);
    }
  }, [prompt, chatSubmitting, chatHistory, currentChatId, user, firebaseConfigured]);

  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setModalOpen(false);
  }, []);

  const handleNodeSelect = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setDetailsOpen(true);
  }, []);

  // When switching to planning mode, reset chat state; when switching to chat, reset graph state
  const handleModeChange = useCallback((mode: ChatMode) => {
    setChatMode(mode);
    if (mode === "planning") {
      setChatHistory([]);
      setChatError("");
      setCurrentChatId(null);
    } else {
      setPageState("idle");
      setGenerateError("");
      setModalOpen(false);
    }
  }, []);

  const displayName =
    firstName ||
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const isSubmitting = chatMode === "planning" ? pageState === "submitting" : chatSubmitting;

  const handleSubmit = chatMode === "planning" ? handleOpenModal : () => void handleChatSubmit();

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
        chats={chats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <SidebarInset className="bg-slate-950 text-slate-100">
        <DashboardHeader />

        {/* ── PLANNING MODE: IDLE / SUBMITTING ────────────────────────────────── */}
        {chatMode === "planning" && (pageState === "idle" || pageState === "submitting") && (
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
                onSubmit={handleSubmit}
                submitting={isSubmitting}
                displayName={displayName}
                mode={chatMode}
                onModeChange={handleModeChange}
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

        {/* ── CHAT MODE: NO HISTORY (centered input) ──────────────────────────── */}
        {chatMode === "chat" && chatHistory.length === 0 && !chatSubmitting && (
          <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
            <ElegantShape
              delay={0.3}
              width={500}
              height={120}
              rotate={12}
              gradient="from-fuchsia-500/[0.12]"
              className="pointer-events-none left-[-4%] top-[10%]"
            />
            <ElegantShape
              delay={0.5}
              width={400}
              height={100}
              rotate={-15}
              gradient="from-violet-500/[0.12]"
              className="pointer-events-none right-[-2%] bottom-[15%]"
            />

            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-4">
              <VercelV0Chat
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                submitting={isSubmitting}
                displayName={displayName}
                mode={chatMode}
                onModeChange={handleModeChange}
              />
            </div>
          </section>
        )}

        {/* ── CHAT MODE: WITH HISTORY (conversation layout) ────────────────────── */}
        {chatMode === "chat" && (chatHistory.length > 0 || chatSubmitting) && (
          <section className="flex flex-1 flex-col overflow-hidden px-4 pb-6 pt-4">
            {/* Mode toggle + scrollable messages */}
            <div className="flex flex-1 flex-col overflow-hidden max-w-3xl mx-auto w-full gap-4">
              {/* Compact mode toggle */}
              <div className="flex items-center gap-1 self-center rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("planning")}
                  className="flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:text-slate-300"
                >
                  Projektplanung
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-medium text-fuchsia-300"
                >
                  Freie Frage
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-fuchsia-500/20 text-fuchsia-50 border border-fuchsia-500/25 whitespace-pre-wrap"
                          : "bg-slate-800/80 text-slate-200 border border-white/8"
                      )}
                    >
                      {msg.role === "user" ? (
                        msg.text
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-base font-bold text-slate-100 mb-2 mt-3 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-semibold text-slate-100 mb-1.5 mt-3 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-200 mb-1 mt-2 first:mt-0">{children}</h3>,
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            code: ({ children, className }) => {
                              const isBlock = className?.includes("language-");
                              return isBlock ? (
                                <code className="block rounded-lg bg-slate-900/80 px-3 py-2 text-xs font-mono text-slate-300 my-2 overflow-x-auto">{children}</code>
                              ) : (
                                <code className="rounded px-1 py-0.5 bg-slate-900/60 text-xs font-mono text-fuchsia-300">{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="my-2">{children}</pre>,
                            strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 underline hover:text-fuchsia-300">{children}</a>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-fuchsia-500/40 pl-3 text-slate-400 my-2">{children}</blockquote>,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {chatSubmitting && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/8 bg-slate-800/80 px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                {chatError && (
                  <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {chatError}
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input pinned to bottom */}
              <div className="shrink-0">
                <div
                  className={cn(
                    "rounded-2xl border transition-all duration-300 bg-slate-900/80 backdrop-blur-sm",
                    prompt.trim()
                      ? "border-fuchsia-400/50 shadow-[0_0_0_4px_rgba(217,70,239,0.08),0_0_32px_rgba(217,70,239,0.12)]"
                      : "border-white/10"
                  )}
                >
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (prompt.trim() && !chatSubmitting) void handleChatSubmit();
                      }
                    }}
                    placeholder="Stell eine weitere Frage…"
                    rows={2}
                    className="w-full resize-none bg-transparent px-5 py-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
                  />
                  <div className="flex items-center justify-end px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleChatSubmit()}
                      disabled={!prompt.trim() || chatSubmitting}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all border",
                        prompt.trim() && !chatSubmitting
                          ? "bg-fuchsia-500 border-fuchsia-400 text-slate-950 hover:bg-fuchsia-400"
                          : "bg-transparent border-zinc-700 text-zinc-500 cursor-not-allowed opacity-40"
                      )}
                    >
                      {chatSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── CONTEXT MODAL ───────────────────────────────────────────────────── */}
        {modalOpen && chatMode === "planning" && (
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
        {chatMode === "planning" && pageState === "graph-ready" && (
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
