"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Clock, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import type { getDocSlugs } from "@/lib/docs";

type DocMeta = {
  title: string;
  description: string;
  category: string;
  order?: number;
};

type Doc = {
  slug: string;
  meta: DocMeta;
  readingTime: number;
};

interface CategoryListProps {
  grouped: Record<string, Doc[]>;
}

const CATEGORY_STYLES: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  "Architektur-Grundlagen": {
    color: "text-cyan-400",
    bg: "bg-cyan-500/8",
    border: "border-cyan-400/20",
  },
  Datenbanken: {
    color: "text-violet-400",
    bg: "bg-violet-500/8",
    border: "border-violet-400/20",
  },
  "Authentifizierung & Sicherheit": {
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/8",
    border: "border-fuchsia-400/20",
  },
  "Deployment & Hosting": {
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-400/20",
  },
  Performance: {
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-400/20",
  },
  "Frontend-Architektur": {
    color: "text-sky-400",
    bg: "bg-sky-500/8",
    border: "border-sky-400/20",
  },
  DevOps: {
    color: "text-orange-400",
    bg: "bg-orange-500/8",
    border: "border-orange-400/20",
  },
  "SaaS & Produkt": {
    color: "text-rose-400",
    bg: "bg-rose-500/8",
    border: "border-rose-400/20",
  },
};

const DEFAULT_STYLE = {
  color: "text-slate-400",
  bg: "bg-slate-500/8",
  border: "border-slate-400/20",
};

export function CategoryList({ grouped }: CategoryListProps) {
  const { isRead, isLoaded } = useProgress();
  
  // Set all categories to be open by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.keys(grouped).reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => {
        const style = CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
        const isOpen = openCategories[category];
        const readCount = items.filter(item => isLoaded && isRead(item.slug)).length;

        return (
          <section
            key={category}
            className="rounded-xl border border-white/5 bg-slate-900/20 overflow-hidden transition-all duration-300"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${style.bg} ${style.border} border`}>
                  <Layers className={`h-5 w-5 ${style.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-200">{category}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500">
                      {items.length} Artikel
                    </span>
                    {readCount > 0 && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="text-sm text-cyan-500/80 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {readCount} gelesen
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={`p-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </div>
            </button>

            {/* Category Items */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[5000px] opacity-100 pb-5 px-5" : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="pt-2 grid sm:grid-cols-2 gap-4">
                {items.map((item) => {
                  const read = isLoaded && isRead(item.slug);

                  return (
                    <Link
                      key={item.slug}
                      href={`/learn/${item.slug}`}
                      className={`group flex flex-col justify-between rounded-xl border p-5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        read 
                          ? "bg-slate-900/70 border-white/5 hover:border-cyan-500/20" 
                          : "bg-slate-900/40 border-white/8 hover:bg-white/5 hover:border-white/12 hover:-translate-y-0.5"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`text-base font-semibold group-hover:text-cyan-400 transition-colors ${read ? "text-slate-300" : "text-slate-50"}`}>
                            {item.meta.title}
                          </h3>
                          {read && (
                            <div className="shrink-0 mt-0.5" title="Bereits gelesen">
                              <CheckCircle2 className="h-4 w-4 text-cyan-500/80" />
                            </div>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed line-clamp-2 ${read ? "text-slate-500" : "text-slate-400"}`}>
                          {item.meta.description}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 text-xs ${read ? "text-slate-600" : "text-slate-500"}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {item.readingTime} Min. Lesezeit
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-all ${read ? "text-slate-600" : "text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5"}`} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
