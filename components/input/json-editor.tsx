"use client";

import { Braces, FileJson2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/interactive-empty-state";

interface JsonExampleOption {
  id: string;
  name: string;
  description: string;
}

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  examples: JsonExampleOption[];
  activeExampleId: string;
  onLoadExample: (exampleId: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function JsonEditor({
  value,
  onChange,
  onGenerate,
  examples,
  activeExampleId,
  onLoadExample,
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
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Complex examples</p>
            <p className="text-xs text-slate-400">Pick one and generate</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <Button
                key={example.id}
                size="xs"
                variant="outline"
                onClick={() => onLoadExample(example.id)}
                className={
                  example.id === activeExampleId
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                    : "border-slate-600 bg-slate-900/40 text-slate-200 hover:bg-slate-800"
                }
              >
                {example.name}
              </Button>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            {examples.find((example) => example.id === activeExampleId)?.description}
          </p>
        </div>

        {value.trim() === "" ? (
          <EmptyState
            theme="dark"
            title="No architecture defined"
            description="Paste your JSON architecture definition or pick an example above to visualise your stack."
            icons={[
              <FileJson2 key="i1" className="h-6 w-6" />,
              <Braces key="i2" className="h-6 w-6" />,
              <Sparkles key="i3" className="h-6 w-6" />,
            ]}
            action={{
              label: "Load first example",
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => onLoadExample(examples[0]?.id ?? ""),
            }}
            className="h-[56vh] max-h-[680px] min-h-[360px] md:h-[62vh] border-cyan-300/20 bg-[#030712]/90 hover:border-cyan-300/40"
          />
        ) : (
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-[56vh] max-h-[680px] min-h-[360px] resize-none overflow-y-auto border-cyan-200/20 bg-[#030712]/90 font-mono text-sm leading-6 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08),inset_0_16px_40px_rgba(0,0,0,0.45)] focus-visible:ring-cyan-400 md:h-[62vh]"
            spellCheck={false}
          />
        )}

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
            onClick={() => onLoadExample(examples[0]?.id ?? "")}
            variant="outline"
            className="rounded-full border-slate-600 bg-slate-900/50 text-slate-100 hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to first sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
