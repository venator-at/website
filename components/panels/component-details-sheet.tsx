"use client";

import { useState } from "react";
import { AlertTriangle, Check, CircleCheckBig, Copy, Cpu, ExternalLink, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { ArchitectureComponentInput, ComponentCategory, ComponentDifficulty, ComponentPricing } from "@/types/architecture";

const categoryLabel: Record<ComponentCategory, string> = {
  frontend: "Frontend", backend: "Backend", database: "Database", auth: "Auth",
  hosting: "Hosting", storage: "Storage", email: "Email", payments: "Payments",
  monitoring: "Monitoring", queue: "Queue", realtime: "Realtime", cdn: "CDN",
  ai: "AI", cms: "CMS", api: "API", mobile: "Mobile", devops: "DevOps",
  testing: "Testing", orm: "ORM",
};

const difficultyLabel: Record<ComponentDifficulty, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
};

const difficultyColor: Record<ComponentDifficulty, string> = {
  beginner: "border-emerald-300/35 bg-emerald-400/15 text-emerald-200",
  intermediate: "border-amber-300/35 bg-amber-400/15 text-amber-200",
  advanced: "border-rose-300/35 bg-rose-400/15 text-rose-200",
};

const pricingLabel: Record<ComponentPricing, string> = {
  free: "Free", freemium: "Freemium", paid: "Paid", "open-source": "Open Source",
};

const pricingColor: Record<ComponentPricing, string> = {
  free: "border-emerald-300/35 bg-emerald-400/15 text-emerald-200",
  freemium: "border-sky-300/35 bg-sky-400/15 text-sky-200",
  paid: "border-rose-300/35 bg-rose-400/15 text-rose-200",
  "open-source": "border-slate-400/35 bg-slate-400/15 text-slate-300",
};

interface ComponentDetailsSheetProps {
  component: ArchitectureComponentInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function renderAlternatives(items: string[]) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No alternatives provided.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const sep = item.indexOf(" \u2014 ");
        const techName = sep >= 0 ? item.slice(0, sep) : item;
        const tradeoff = sep >= 0 ? item.slice(sep + 3) : null;
        return (
          <li key={item} className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm">
            <span className="font-medium text-slate-100">{techName}</span>
            {tradeoff && <span className="text-slate-400"> — {tradeoff}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function renderList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ComponentDetailsSheet({
  component,
  open,
  onOpenChange,
}: ComponentDetailsSheetProps) {
  const [copiedTech, setCopiedTech] = useState(false);

  function handleCopyTech(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedTech(true);
    setTimeout(() => setCopiedTech(false), 1500);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-l border-slate-700 bg-slate-950/95 p-0 sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
          <Badge className="mb-3 w-fit rounded-full border border-cyan-300/35 bg-cyan-400/15 text-cyan-100">
            Component Details
          </Badge>
          <SheetTitle className="text-2xl font-bold text-slate-100">
            {component?.name ?? "No component selected"}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            {component
              ? `${component.tech} · ${categoryLabel[component.category]}`
              : "Click on a node in the graph to inspect its details."}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-11rem)] px-6 pb-8">
          {!component ? (
            <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-5 text-sm text-slate-300">
              Select a node in the graph to populate this panel.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full border border-cyan-300/35 bg-cyan-400/15 text-cyan-100">
                  {categoryLabel[component.category]}
                </Badge>
                <Badge className={`rounded-full border ${difficultyColor[component.difficulty]}`}>
                  {difficultyLabel[component.difficulty]}
                </Badge>
                <Badge className={`rounded-full border ${pricingColor[component.pricing]}`}>
                  {pricingLabel[component.pricing]}
                </Badge>
              </div>

              {component.docsUrl && (() => {
                try {
                  const hostname = new URL(component.docsUrl).hostname;
                  return (
                    <a
                      href={component.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-fit items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-cyan-400 hover:bg-slate-800/70 hover:text-cyan-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span>Official Docs</span>
                      <span className="text-slate-500 text-xs">{hostname}</span>
                    </a>
                  );
                } catch {
                  return null;
                }
              })()}

              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Cpu className="h-4 w-4 text-cyan-300" />
                  Technology
                </h4>
                <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2">
                  <span className="flex-1 text-sm text-slate-200">{component.tech}</span>
                  <button
                    onClick={() => handleCopyTech(component.tech)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label="Copy technology name"
                  >
                    {copiedTech
                      ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Lightbulb className="h-4 w-4 text-amber-300" />
                  Why this choice
                </h4>
                <p className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                  {component.reason}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <CircleCheckBig className="h-4 w-4 text-emerald-300" />
                  Alternatives
                </h4>
                {renderAlternatives(component.alternatives)}
              </section>

              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <AlertTriangle className="h-4 w-4 text-rose-300" />
                  Risks
                </h4>
                {renderList(component.risks, "No explicit risks provided.")}
              </section>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
