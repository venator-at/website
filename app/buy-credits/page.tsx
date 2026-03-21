"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import { CREDIT_PACKS, type CreditPackKey } from "@/lib/stripe/packs";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

const PACKS: { key: CreditPackKey; highlight?: boolean }[] = [
  { key: "starter" },
  { key: "pro", highlight: true },
  { key: "power" },
];

export default function BuyCreditsPage() {
  const { user, credits } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<CreditPackKey | null>(null);
  const [error, setError] = useState("");

  async function handleBuy(pack: CreditPackKey) {
    if (!user || !auth?.currentUser) {
      router.push("/login");
      return;
    }

    setLoading(pack);
    setError("");

    try {
      const idToken = await getIdToken(auth.currentUser, false);
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ pack }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Fehler beim Erstellen der Checkout-Session.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardHeader />

      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <Zap className="h-3.5 w-3.5" />
            Guthaben aufladen
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-50">
            Credits kaufen
          </h1>
          <p className="mx-auto mt-3 max-w-md text-slate-400">
            Kein Abo. Tokens verfallen nie. Zahle einmalig und nutze Venator wann du willst.
          </p>

          {user && (
            <p className="mt-3 text-sm text-slate-500">
              Aktuelles Guthaben:{" "}
              <span className="font-semibold text-cyan-400">{credits} Credits</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Pack cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PACKS.map(({ key, highlight }) => {
            const pack = CREDIT_PACKS[key];
            const isLoading = loading === key;

            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  highlight
                    ? "border-cyan-500/50 bg-slate-900/70 shadow-[0_0_40px_-12px_rgba(34,211,238,0.3)]"
                    : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
                }`}
              >
                {highlight && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent" />
                )}

                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                      Beliebt
                    </span>
                  </div>
                )}

                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  {pack.name}
                </p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-slate-50">{pack.price}€</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">Einmalzahlung · kein Abo</p>

                <ul className="mt-4 mb-6 flex-1 space-y-2.5">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-100">{pack.credits} Credits</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    {pack.description}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    Tokens verfallen nie
                  </li>
                </ul>

                <button
                  onClick={() => void handleBuy(key)}
                  disabled={isLoading || loading !== null}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                    highlight
                      ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                      : "border border-slate-600 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Jetzt kaufen"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Sichere Zahlung via Stripe · 1 Architektur ≈ 10 Credits · 1 Refactoring ≈ 2 Credits
        </p>
      </div>
    </div>
  );
}
