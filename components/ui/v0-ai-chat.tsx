"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  Cpu,
  Loader2,
  MessageCircle,
  Paperclip,
  X,
} from "lucide-react";

// ─── Auto-resize hook ──────────────────────────────────────────────────────────

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// ─── Starter templates ─────────────────────────────────────────────────────────

const STARTERS = [
  {
    emoji: "🛒",
    label: "E-Commerce Plattform",
    prompt:
      "Ich möchte eine E-Commerce-Plattform für handgemachte Produkte bauen, mit Produktkatalog, Warenkorb und Stripe-Bezahlung.",
  },
  {
    emoji: "📱",
    label: "Social Media App",
    prompt:
      "Eine Social-Media-App, auf der Nutzer kurze Beiträge posten, anderen folgen und Feed-Beiträge liken können.",
  },
  {
    emoji: "🤖",
    label: "KI-SaaS Wrapper",
    prompt:
      "Ein KI-SaaS-Produkt, das GPT-4 nutzt, um automatisch Marketing-Texte und Social-Media-Posts zu generieren.",
  },
  {
    emoji: "📊",
    label: "Admin Dashboard",
    prompt:
      "Ein internes Admin-Dashboard für ein kleines Team mit Datentabellen, Rollenverwaltung und Analytics-Charts.",
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ChatMode = "planning" | "chat";

interface VercelV0ChatProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  displayName?: string;
  onFilesChange?: (files: File[]) => void;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function VercelV0Chat({
  value,
  onChange,
  onSubmit,
  submitting = false,
  displayName,
  onFilesChange,
  mode = "planning",
  onModeChange,
}: VercelV0ChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 200,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !submitting) {
        onSubmit();
        adjustHeight(true);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleStarterClick = (prompt: string) => {
    onChange(prompt);
    textareaRef.current?.focus();
  };

  const handleSubmitClick = () => {
    if (value.trim() && !submitting) {
      onSubmit();
      adjustHeight(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    const updated = [...attachedFiles, ...selected];
    setAttachedFiles(updated);
    onFilesChange?.(updated);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const updated = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(updated);
    onFilesChange?.(updated);
  };

  const hasContent = value.trim().length > 0 || attachedFiles.length > 0;

  const title =
    mode === "planning"
      ? `Was möchtest du heute bauen`
      : `Was möchtest du wissen`;

  const placeholder =
    mode === "planning"
      ? "Beschreibe deine App-Idee (z.B. Ein Marktplatz für gebrauchte Fahrräder)…"
      : "Stell mir eine Frage zu Technologien, Konzepten oder deinem Projekt…";

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-5">
      <h1 className="text-3xl font-bold tracking-tight text-center text-slate-50 md:text-4xl text-balance">
        {title}
        {displayName ? (
          <>
            ,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              {displayName}?
            </span>
          </>
        ) : (
          "?"
        )}
      </h1>

      {/* Mode toggle */}
      {onModeChange && (
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => onModeChange("planning")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              mode === "planning"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            )}
          >
            <Cpu className="h-3 w-3" />
            Projektplanung
          </button>
          <button
            type="button"
            onClick={() => onModeChange("chat")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              mode === "chat"
                ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30 shadow-[0_0_12px_rgba(217,70,239,0.12)]"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            )}
          >
            <MessageCircle className="h-3 w-3" />
            Freie Frage
          </button>
        </div>
      )}

      <div className="w-full">
        <div
          className={cn(
            "rounded-2xl border transition-all duration-300 bg-slate-900/80 backdrop-blur-sm",
            hasContent
              ? mode === "planning"
                ? "border-cyan-400/50 shadow-[0_0_0_4px_rgba(34,211,238,0.08),0_0_32px_rgba(34,211,238,0.12)]"
                : "border-fuchsia-400/50 shadow-[0_0_0_4px_rgba(217,70,239,0.08),0_0_32px_rgba(217,70,239,0.12)]"
              : "border-white/10"
          )}
        >
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full px-5 py-4",
              "resize-none",
              "bg-transparent",
              "border-none",
              "text-slate-200 text-sm",
              "focus:outline-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-slate-600 placeholder:text-sm",
              "min-h-[72px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Attached file chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-2">
              {attachedFiles.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-white/10 px-2.5 py-0.5 text-[11px] text-slate-300 max-w-[180px]"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 py-2">
            {/* File upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
              <span className="text-xs">Anhang</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={!value.trim() || submitting}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all border",
                value.trim() && !submitting
                  ? mode === "planning"
                    ? "bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400"
                    : "bg-fuchsia-500 border-fuchsia-400 text-slate-950 hover:bg-fuchsia-400"
                  : "bg-transparent border-zinc-700 text-zinc-500 cursor-not-allowed opacity-40"
              )}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUpIcon className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Senden</span>
            </button>
          </div>
        </div>

        {/* Starter chips — only in planning mode */}
        {mode === "planning" && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center">
            {STARTERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleStarterClick(s.prompt)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/90"
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Chat mode hint */}
        {mode === "chat" && (
          <p className="mt-3 text-center text-xs text-slate-600">
            Frag mich alles — Technologien, Konzepte, Best Practices oder allgemeine Fragen.
          </p>
        )}
      </div>
    </div>
  );
}
