import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllDocs } from "@/lib/docs";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { CategoryList } from "@/components/docs/CategoryList";

export const metadata: Metadata = {
  title: "Docs & Tutorials | Venator",
  description:
    "Lerne, wie moderne Software-Architektur funktioniert. Tutorials zu Frontend-Frameworks, Datenbanken, CI/CD, Authentifizierung und mehr – für Anfänger und Junior-Entwickler.",
  keywords:
    "Software-Architektur, Next.js, Datenbanken, Authentifizierung, CI/CD, TypeScript, Hosting, SaaS, Tutorials, Docs",
  openGraph: {
    title: "Docs & Tutorials | Venator",
    description:
      "Verstehe moderne Architektur-Entscheidungen mit verständlichen Leitfäden für Anfänger und Junior-Entwickler.",
    type: "website",
    siteName: "Venator",
  },
  twitter: {
    card: "summary",
    title: "Docs & Tutorials | Venator",
    description:
      "Lerne, wie moderne Software-Architektur funktioniert – für Anfänger erklärt.",
  },
};



export default function LearnHubPage() {
  const docs = getAllDocs();

  // Group by category
  const grouped = docs.reduce(
    (acc, doc) => {
      const category = doc.meta.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, typeof docs>
  );

  const totalDocs = docs.length;
  const totalMinutes = docs.reduce((sum, d) => sum + d.readingTime, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full bg-cyan-500/6 blur-[140px]" />
        <div className="absolute -right-60 bottom-0 h-[600px] w-[600px] rounded-full bg-fuchsia-500/6 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Venator"
                width={22}
                height={22}
                className="rounded-md"
              />
              <span className="text-sm font-semibold text-slate-200">
                Venator
              </span>
            </div>
          </div>
          {/* Stats pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-500">
            <BookOpen className="h-3.5 w-3.5" />
            {totalDocs} Artikel · {totalMinutes} Min.
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-16">
        {/* Hero */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/8 px-3 py-1.5 text-xs text-cyan-400 mb-6">
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl text-balance mb-4">
            Lerne, wie{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              moderne Architektur
            </span>{" "}
            funktioniert
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
            Alle Artikel und Leitfäden, um erfolgreiche Software-Projekte von
            Grund auf richtig zu planen — verständlich erklärt für Anfänger und
            Junior-Entwickler.
          </p>

          {/* Quick stats */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { label: "Artikel", value: String(totalDocs) },
              { label: "Lesezeit gesamt", value: `${totalMinutes} Min.` },
              {
                label: "Kategorien",
                value: String(Object.keys(grouped).length),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col rounded-xl border border-white/8 bg-slate-900/40 px-5 py-3"
              >
                <span className="text-xl font-bold text-slate-50">
                  {stat.value}
                </span>
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-14">
          <CategoryList grouped={grouped} />
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 rounded-2xl border border-white/8 bg-gradient-to-br from-cyan-500/8 to-fuchsia-500/8 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-50 mb-2">
            Bereit, dein Projekt zu planen?
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            Nutze Venator, um die richtige Architektur für dein Projekt zu
            finden — mit KI-gestützten Empfehlungen.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 hover:scale-105"
          >
            Jetzt Projekt planen
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
