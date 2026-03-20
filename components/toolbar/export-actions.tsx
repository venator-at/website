"use client";

import { Download, FileImage, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportActionsProps {
  disabled: boolean;
  isExporting: boolean;
  onExportPng: () => Promise<void>;
  onExportSvg: () => Promise<void>;
}

export function ExportActions({
  disabled,
  isExporting,
  onExportPng,
  onExportSvg,
}: ExportActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-2 shadow-[0_10px_25px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="inline-flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        <Download className="h-3.5 w-3.5 text-cyan-300" />
        Export
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void onExportPng()}
        disabled={disabled || isExporting}
        className="rounded-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
      >
        <FileImage className="mr-1.5 h-4 w-4" />
        PNG
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void onExportSvg()}
        disabled={disabled || isExporting}
        className="rounded-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
      >
        <FileType2 className="mr-1.5 h-4 w-4" />
        SVG
      </Button>
    </div>
  );
}
