import Link from "next/link";
import Image from "next/image";
import { getAllDocs } from "@/lib/docs";
import { ArrowLeft, BookOpen, Layers, FileText } from "lucide-react";

export default function LearnHubPage() {
  const docs = getAllDocs();
  
  // Group by category
  const grouped = docs.reduce((acc, doc) => {
    const category = doc.meta.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof docs>);

  // Sort categories by order if needed, but we can just map over Object.entries
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full bg-cyan-500/6 blur-[140px]" />
        <div className="absolute -right-60 bottom-0 h-[600px] w-[600px] rounded-full bg-fuchsia-500/6 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Venator" width={22} height={22} className="rounded-md" />
              <span className="text-sm font-semibold text-slate-200">Venator</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-16">
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
            Hier findest du alle Artikel und Leitfäden, um erfolgreiche Software-Projekte von Grund auf richtig zu planen und umzusetzen.
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-fuchsia-400" />
                {category}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/learn/${item.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-white/8 bg-slate-900/40 p-5 transition-colors hover:bg-white/5 hover:border-white/10"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-slate-50 mb-2 group-hover:text-cyan-400 transition-colors">
                        {item.meta.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                        {item.meta.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                      <FileText className="h-3.5 w-3.5" />
                      Artikel lesen
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
