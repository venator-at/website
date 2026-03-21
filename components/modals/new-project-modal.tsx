"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDescription?: string;
  onConfirm: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function NewProjectModal({
  open,
  onOpenChange,
  initialDescription = "",
  onConfirm,
}: NewProjectModalProps) {
  const [projectName, setProjectName] = React.useState("");
  const [projectType, setProjectType] = React.useState("web-app");
  const [experienceLevel, setExperienceLevel] = React.useState("beginner");
  const [budgetLevel, setBudgetLevel] = React.useState<string[]>(["free"]);

  // Reset name when modal opens
  React.useEffect(() => {
    if (open) {
      setProjectName("");
      setProjectType("web-app");
      setExperienceLevel("beginner");
      setBudgetLevel(["free"]);
    }
  }, [open]);

  const toggleBudget = (value: string) => {
    setBudgetLevel((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "transition-opacity duration-200",
            "data-starting-style:opacity-0 data-ending-style:opacity-0"
          )}
        />

        {/* Centered popup */}
        <DialogPrimitive.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-white/10 bg-slate-900 shadow-2xl",
            "flex flex-col gap-0 overflow-hidden",
            "transition-all duration-200",
            "data-starting-style:opacity-0 data-starting-style:scale-95",
            "data-ending-style:opacity-0 data-ending-style:scale-95"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold text-slate-100">
                Neues Projekt
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-slate-500">
                Beschreibe dein Projekt genauer, damit die KI bessere Empfehlungen geben kann.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-300"
              aria-label="Schließen"
            >
              <XIcon className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Form body */}
          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5 max-h-[70vh]">
            {/* Project name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                Projektname <span className="text-slate-600">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="z. B. Mein Fahrrad-Marktplatz"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5",
                  "text-sm text-slate-200 placeholder:text-slate-600",
                  "outline-none transition-colors",
                  "focus:border-cyan-400/50 focus:bg-slate-800"
                )}
              />
            </div>

            {/* Idea / description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                Projektbeschreibung
              </label>
              <textarea
                rows={3}
                placeholder="Beschreibe deine App-Idee so detailliert wie möglich…"
                defaultValue={initialDescription}
                className={cn(
                  "w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5",
                  "text-sm text-slate-200 placeholder:text-slate-600 resize-none",
                  "outline-none transition-colors",
                  "focus:border-cyan-400/50 focus:bg-slate-800"
                )}
              />
              <p className="text-[11px] text-slate-600">
                Die Beschreibung aus dem Eingabefeld wurde übernommen — du kannst sie hier anpassen.
              </p>
            </div>

            {/* Project type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Projekttyp</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5",
                  "text-sm text-slate-200",
                  "outline-none transition-colors cursor-pointer",
                  "focus:border-cyan-400/50 focus:bg-slate-800",
                  "appearance-none"
                )}
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Erfahrungslevel</label>
              <div className="flex gap-2">
                {[
                  { value: "beginner", label: "Anfänger" },
                  { value: "junior", label: "Junior" },
                  { value: "mid", label: "Mid-Level" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperienceLevel(opt.value)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
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
              <label className="text-xs font-medium text-slate-400">
                Budget-Rahmen <span className="text-slate-600">(Mehrfachauswahl möglich)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "free", label: "Kostenlos", sub: "Open-Source / Free Tier" },
                  { value: "low", label: "Niedrig", sub: "< 20 € / Monat" },
                  { value: "medium", label: "Mittel", sub: "20–100 € / Monat" },
                  { value: "high", label: "Hoch", sub: "> 100 € / Monat" },
                ].map((opt) => {
                  const active = budgetLevel.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleBudget(opt.value)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-cyan-400/60 bg-cyan-500/15"
                          : "border-white/8 bg-white/4 hover:border-white/15"
                      )}
                    >
                      {/* Checkbox indicator */}
                      <span
                        className={cn(
                          "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                          active
                            ? "border-cyan-400 bg-cyan-400"
                            : "border-slate-600 bg-transparent"
                        )}
                      >
                        {active && (
                          <svg className="h-2.5 w-2.5 text-slate-950" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-white/8 px-6 py-4">
            <button
              type="button"
              onClick={handleCancel}
              className={cn(
                "rounded-xl border border-white/10 bg-white/4 px-4 py-2",
                "text-sm font-medium text-slate-400 transition-colors",
                "hover:border-white/15 hover:bg-white/8 hover:text-slate-200"
              )}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={cn(
                "rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-5 py-2",
                "text-sm font-medium text-cyan-300 transition-all",
                "hover:border-cyan-400/70 hover:bg-cyan-500/30 hover:text-cyan-200"
              )}
            >
              Weiter →
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
