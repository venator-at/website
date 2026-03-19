"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Cpu, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ArchitectureNode as ArchitectureFlowNode } from "@/types/architecture";

export function ArchitectureNode({ data, selected }: NodeProps<ArchitectureFlowNode>) {
  const alternativesCount = data.component.alternatives.length;
  const risksCount = data.component.risks.length;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-0 !bg-cyan-300"
      />
      <Tooltip>
        <TooltipTrigger className="block text-left">
          <motion.article
            key={`${data.component.name}-${data.renderVersion}`}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: data.animationDelayMs / 1000,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -4, rotate: -0.4 }}
            className={`w-[280px] rounded-2xl border p-4 shadow-lg backdrop-blur transition-all ${
              selected
                ? "border-fuchsia-300/70 bg-fuchsia-500/15 ring-2 ring-fuchsia-300/30 shadow-[0_0_30px_rgba(217,70,239,0.25)]"
                : "border-cyan-200/30 bg-slate-900/75 hover:border-cyan-300/60"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="line-clamp-1 text-base font-bold tracking-tight text-slate-100">
                {data.component.name}
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full border border-cyan-300/30 bg-cyan-300/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-100"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Component
              </Badge>
            </div>

            <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200">
              <Cpu className="h-3.5 w-3.5 text-cyan-300" />
              <span className="line-clamp-1 font-medium">{data.component.tech}</span>
            </div>

            <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{data.shortReason}</p>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
              <span>{alternativesCount} alternatives</span>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span className="inline-flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-300" />
                {risksCount} risks
              </span>
            </div>
          </motion.article>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-slate-700 bg-slate-950 text-slate-50">
          <p className="text-xs">{data.component.reason}</p>
        </TooltipContent>
      </Tooltip>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-0 !bg-cyan-300"
      />
    </>
  );
}
