"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/dashboard");
      return;
    }

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/dashboard");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-10 max-w-md w-full shadow-[0_0_50px_-12px_rgba(52,211,153,0.2)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-slate-50">Zahlung erfolgreich!</h1>
        <p className="mt-2 text-slate-400">
          Deine Credits wurden deinem Konto gutgeschrieben.
        </p>

        <p className="mt-6 text-sm text-slate-500">
          Weiterleitung in{" "}
          <span className="font-semibold text-slate-300">{countdown}s</span>…
        </p>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition-colors"
        >
          Jetzt zum Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
