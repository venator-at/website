"use client";

import { AlertTriangle, CircleCheckBig, Cpu, Lightbulb } from "lucide-react";
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
import type { ArchitectureComponentInput } from "@/types/architecture";

interface ComponentDetailsSheetProps {
  component: ArchitectureComponentInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
          <SheetDescription className="text-slate-300">
            Click on a node to inspect technology choice, rationale, alternatives, and risks.
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
              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Cpu className="h-4 w-4 text-cyan-300" />
                  Technology
                </h4>
                <p className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                  {component.tech}
                </p>
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
                {renderList(component.alternatives, "No alternatives provided.")}
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
