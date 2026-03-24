"use client";

import { ArrowRight, GitBranch } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { ArchitectureEdge } from "@/types/architecture";

interface ConnectionDetailsSheetProps {
  edge: ArchitectureEdge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionDetailsSheet({
  edge,
  open,
  onOpenChange,
}: ConnectionDetailsSheetProps) {
  const from = edge?.data?.fromName ?? "";
  const to = edge?.data?.toName ?? "";
  const fullType = edge?.data?.relationType ?? "";

  // Split into protocol and description at " — " or " – "
  const separatorIndex = fullType.search(/ [—–] /);
  const protocol = separatorIndex > 0 ? fullType.slice(0, separatorIndex) : fullType;
  const description = separatorIndex > 0 ? fullType.slice(separatorIndex + 3) : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-l border-slate-700 bg-slate-950/95 p-0 sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
          <Badge className="mb-3 w-fit rounded-full border border-cyan-300/35 bg-cyan-400/15 text-cyan-100">
            Connection Details
          </Badge>
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-100">
            <span className="truncate">{from}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="truncate">{to}</span>
          </SheetTitle>
          <SheetDescription className="text-slate-300">
            Wie diese zwei Komponenten miteinander kommunizieren.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-11rem)] px-6 pb-8">
          {!edge ? (
            <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-5 text-sm text-slate-300">
              Wähle eine Verbindung im Graph aus, um Details zu sehen.
            </div>
          ) : (
            <div className="space-y-5">
              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <GitBranch className="h-4 w-4 text-cyan-300" />
                  Protokoll / Mechanismus
                </h4>
                <p className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-medium text-cyan-200">
                  {protocol}
                </p>
              </section>

              {description && (
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-100">Beschreibung</h4>
                  <p className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm leading-relaxed text-slate-200">
                    {description}
                  </p>
                </section>
              )}

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-100">Vollständiger Text</h4>
                <p className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm leading-relaxed text-slate-300">
                  {fullType}
                </p>
              </section>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
