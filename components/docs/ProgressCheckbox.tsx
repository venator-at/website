"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";

interface ProgressCheckboxProps {
  slug: string;
}

export function ProgressCheckbox({ slug }: ProgressCheckboxProps) {
  const { isRead, toggleRead, isLoaded } = useProgress();

  // Prevents hydration mismatch by not rendering anything until loaded
  if (!isLoaded) return null;

  const read = isRead(slug);

  return (
    <div className="mt-12 rounded-xl border border-white/10 bg-slate-900/40 p-6 flex items-center justify-between transition-colors">
      <div>
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          Gelesen und verstanden?
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Markiere diesen Artikel als fertig, um deinen Fortschritt im Auge zu behalten.
        </p>
      </div>
      <button
        onClick={() => toggleRead(slug)}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          read
            ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
            : "bg-white/5 text-slate-300 hover:bg-white/10"
        }`}
      >
        {read ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Als gelesen markiert
          </>
        ) : (
          <>
            <Circle className="h-5 w-5" />
            Als fertig markieren
          </>
        )}
      </button>
    </div>
  );
}
