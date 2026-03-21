"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, PlusIcon, ShieldCheckIcon, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { getIdToken } from "firebase/auth";
import { CREDIT_PACKS, CREDITS_PER_EURO, type CreditPackKey } from "@/lib/stripe/packs";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BorderTrail } from "@/components/ui/border-trail";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BuyCreditsPage() {
  const { user, credits } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<CreditPackKey | null>(null);
  const [error, setError] = useState("");
  const [customAmount, setCustomAmount] = useState(5);
  const [customError, setCustomError] = useState("");

  async function handleBuy(pack: CreditPackKey, amount?: number) {
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
        body: JSON.stringify({ pack, ...(amount !== undefined && { customAmount: amount }) }),
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

  function handleCustomBuy() {
    setCustomError("");
    if (customAmount < 5 || customAmount > 999999.99) {
      setCustomError("Betrag muss zwischen 5€ und 999.999,99€ liegen.");
      return;
    }
    void handleBuy("custom", customAmount);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />

      <section className="relative min-h-screen overflow-hidden py-24">
        <div id="pricing" className="mx-auto w-full max-w-5xl space-y-5 px-4">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mx-auto max-w-xl space-y-5"
          >
            <div className="flex justify-center">
              <div className="rounded-lg border px-4 py-1 font-mono text-sm">Pricing</div>
            </div>
            <h2 className="mt-5 text-center text-2xl font-bold tracking-tighter md:text-3xl lg:text-4xl">
              Simple Pricing for Your Architecture Planning
            </h2>
            <p className="text-muted-foreground mt-5 text-center text-sm md:text-base">
              No subscription. Credits never expire. Pay once, use Venator whenever you want.
            </p>
            {user && (
              <p className="text-center text-sm text-muted-foreground">
                Current balance:{" "}
                <span className="font-semibold text-cyan-400">{credits} Credits</span>
              </p>
            )}
          </motion.div>

          {error && (
            <div className="mx-auto max-w-2xl rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Cards */}
          <div className="relative">
            {/* Background grid */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 size-full",
                "bg-[linear-gradient(to_right,hsl(var(--foreground)/.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/.08)_1px,transparent_1px)]",
                "bg-[size:32px_32px]",
                "[mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]",
              )}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="mx-auto w-full max-w-3xl space-y-2"
            >
              {/* Card grid with corner plus icons */}
              <div className="relative grid md:grid-cols-3 bg-background border p-4 gap-4">
                <PlusIcon className="absolute -top-3 -left-3 size-5.5 text-muted-foreground" />
                <PlusIcon className="absolute -top-3 -right-3 size-5.5 text-muted-foreground" />
                <PlusIcon className="absolute -bottom-3 -left-3 size-5.5 text-muted-foreground" />
                <PlusIcon className="absolute -right-3 -bottom-3 size-5.5 text-muted-foreground" />

                {/* Starter — 5€ */}
                <div className="w-full px-4 pt-5 pb-4 flex flex-col">
                  <div className="space-y-1">
                    <h3 className="leading-none font-semibold">{CREDIT_PACKS.starter.name}</h3>
                    <p className="text-muted-foreground text-sm">Perfect for your first project.</p>
                  </div>
                  <div className="mt-10 space-y-1 flex-1">
                    <div className="text-muted-foreground flex items-end gap-0.5 text-xl">
                      <span>€</span>
                      <span className="text-foreground -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                        {CREDIT_PACKS.starter.price}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">One-time · no subscription</p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-foreground">{CREDIT_PACKS.starter.credits} Credits</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        {CREDIT_PACKS.starter.description}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        Credits never expire
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => void handleBuy("starter")}
                    disabled={loading !== null}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    {loading === "starter" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Planning"}
                  </button>
                </div>

                {/* Pro — 10€ (highlighted with BorderTrail) */}
                <div className="relative w-full rounded-lg border px-4 pt-5 pb-4 flex flex-col">
                  <BorderTrail
                    style={{
                      boxShadow:
                        "0px 0px 60px 30px rgb(255 255 255 / 20%), 0 0 100px 60px rgb(34 211 238 / 15%), 0 0 140px 90px rgb(34 211 238 / 10%)",
                    }}
                    size={100}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="leading-none font-semibold">{CREDIT_PACKS.pro.name}</h3>
                      <Badge>Most Popular</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">For complex projects and growing teams.</p>
                  </div>
                  <div className="mt-10 space-y-1 flex-1">
                    <div className="text-muted-foreground flex items-end text-xl">
                      <span>€</span>
                      <span className="text-foreground -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                        {CREDIT_PACKS.pro.price}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">One-time · no subscription</p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-foreground">{CREDIT_PACKS.pro.credits} Credits</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        {CREDIT_PACKS.pro.description}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        Credits never expire
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => void handleBuy("pro")}
                    disabled={loading !== null}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Started Now"}
                  </button>
                </div>

                {/* Custom */}
                <div className="w-full px-4 pt-5 pb-4 flex flex-col">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="leading-none font-semibold">Custom</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">Choose exactly what you need.</p>
                  </div>
                  <div className="mt-10 flex-1 space-y-1">
                    <div className="text-muted-foreground flex items-end gap-0.5 text-xl">
                      <span>€</span>
                      <span className="text-foreground -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                        {customAmount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">One-time · no subscription</p>

                    {/* Slider */}
                    <div className="pt-3">
                      <input
                        type="range"
                        min={5}
                        max={1000}
                        step={1}
                        value={Math.min(customAmount, 1000)}
                        onChange={(e) => {
                          setCustomAmount(Number(e.target.value));
                          setCustomError("");
                        }}
                        className="w-full accent-cyan-400"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>5€</span>
                        <span>1.000€+</span>
                      </div>
                    </div>

                    {/* Number input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={5}
                        max={999999.99}
                        step={0.01}
                        value={customAmount}
                        onChange={(e) => {
                          const val = Math.max(5, Number(e.target.value));
                          setCustomAmount(Math.round(val * 100) / 100);
                          setCustomError("");
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-cyan-500/60 focus:outline-none"
                      />
                      <span className="text-sm text-muted-foreground shrink-0">€</span>
                    </div>

                    {customError && (
                      <p className="text-xs text-red-400 pt-1">{customError}</p>
                    )}

                    <ul className="mt-3 space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {Math.floor(customAmount * CREDITS_PER_EURO)} Credits
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        {Math.floor(customAmount * CREDITS_PER_EURO / 10)} complete architectures
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        Credits never expire
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleCustomBuy}
                    disabled={loading !== null}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    {loading === "custom" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy Now"}
                  </button>
                </div>
              </div>

              {/* Footer note */}
              <div className="text-muted-foreground flex items-center justify-center gap-x-2 text-sm pt-2">
                <ShieldCheckIcon className="size-4" />
                <span>Secure payment via Stripe · 1 architecture ≈ 10 Credits · 1 refactoring ≈ 2 Credits</span>
              </div>
            </motion.div>
          </div>

        </div>
      </section>
    </div>
  );
}
