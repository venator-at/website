"use client";

import { Braces, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
  error: string | null;
}

export function JsonEditor({
  value,
  onChange,
  onGenerate,
  onLoadSample,
  isLoading,
  error,
}: JsonEditorProps) {
  return (
    <Card className="glass-panel neon-ring relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300" />
      <div className="pointer-events-none absolute -left-20 top-16 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-100">
          <Braces className="h-5 w-5 text-cyan-300" />
          Architecture JSON Input
        </CardTitle>
        <p className="text-sm text-slate-300">
          Paste your JSON. The graph appears after 2 seconds with animated nodes.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[56vh] max-h-[680px] min-h-[360px] resize-none overflow-y-auto border-cyan-200/20 bg-[#030712]/90 font-mono text-sm leading-6 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08),inset_0_16px_40px_rgba(0,0,0,0.45)] focus-visible:ring-cyan-400 md:h-[62vh]"
          spellCheck={false}
        />

        {error ? (
          <p className="rounded-md border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p>
        ) : (
          <p className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
            Tip: Use meaningful component names to get a cleaner layout and edge labels.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onGenerate}
            disabled={isLoading}
            className="min-w-36 rounded-full border border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.18)] hover:bg-cyan-300/25"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? "Building graph..." : "Generate Graph"}
          </Button>

          <Button
            onClick={onLoadSample}
            variant="outline"
            className="rounded-full border-slate-600 bg-slate-900/50 text-slate-100 hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Load sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
