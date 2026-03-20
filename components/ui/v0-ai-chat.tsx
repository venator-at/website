"use client";

import { useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  ShoppingCart,
  SmartphoneNfc,
  Sparkles,
  Users,
  Loader2,
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
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
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
    icon: ShoppingCart,
    label: "E-Commerce Plattform",
    prompt:
      "Ich möchte eine E-Commerce-Plattform für handgemachte Produkte bauen, mit Produktkatalog, Warenkorb und Stripe-Bezahlung.",
  },
  {
    icon: SmartphoneNfc,
    label: "Social Media App MVP",
    prompt:
      "Eine Social-Media-App, auf der Nutzer kurze Beiträge posten, anderen folgen und Feed-Beiträge liken können.",
  },
  {
    icon: Sparkles,
    label: "KI-SaaS Wrapper",
    prompt:
      "Ein KI-SaaS-Produkt, das GPT-4 nutzt, um automatisch Marketing-Texte und Social-Media-Posts zu generieren.",
  },
  {
    icon: Users,
    label: "Admin Dashboard",
    prompt:
      "Ein internes Admin-Dashboard für ein kleines Team mit Datentabellen, Rollenverwaltung und Analytics-Charts.",
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VercelV0ChatProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  displayName?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function VercelV0Chat({
  value,
  onChange,
  onSubmit,
  submitting = false,
  displayName,
}: VercelV0ChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 200,
  });

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

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-center text-slate-50 md:text-4xl text-balance">
        Was möchtest du heute bauen
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

      <div className="w-full">
        <div
          className={cn(
            "relative rounded-2xl border transition-all duration-300 bg-slate-900/80 backdrop-blur-sm",
            value.length > 0
              ? "border-cyan-400/50 shadow-[0_0_0_4px_rgba(34,211,238,0.08),0_0_32px_rgba(34,211,238,0.12)]"
              : "border-white/10"
          )}
        >
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Beschreibe deine App-Idee (z.B. Ein Marktplatz für gebrauchte Fahrräder)…"
              className={cn(
                "w-full px-5 py-4 pr-14",
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
          </div>

          <div className="flex items-center justify-end p-3">
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={!value.trim() || submitting}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all border",
                value.trim() && !submitting
                  ? "bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400"
                  : "bg-transparent border-zinc-700 text-zinc-500 cursor-not-allowed opacity-40"
              )}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              )}
              <span className="sr-only">Senden</span>
            </button>
          </div>
        </div>

        {/* Starter badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {STARTERS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleStarterClick(s.prompt)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/8 hover:text-cyan-300"
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
