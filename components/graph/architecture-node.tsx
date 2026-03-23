"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Cpu, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArchitectureNode as ArchitectureFlowNode, ComponentCategory, ComponentDifficulty, ComponentPricing } from "@/types/architecture";

const categoryLabel: Record<ComponentCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  auth: "Auth",
  hosting: "Hosting",
  storage: "Storage",
  email: "Email",
  payments: "Payments",
  monitoring: "Monitoring",
  queue: "Queue",
  realtime: "Realtime",
  cdn: "CDN",
  ai: "AI",
  cms: "CMS",
  api: "API",
  mobile: "Mobile",
  devops: "DevOps",
  testing: "Testing",
  orm: "ORM",
};

const categoryColor: Record<ComponentCategory, string> = {
  frontend: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
  backend: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
  api: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
  database: "border-violet-300/30 bg-violet-300/15 text-violet-100",
  orm: "border-violet-300/30 bg-violet-300/15 text-violet-100",
  auth: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  hosting: "border-sky-300/30 bg-sky-300/15 text-sky-100",
  cdn: "border-sky-300/30 bg-sky-300/15 text-sky-100",
  storage: "border-sky-300/30 bg-sky-300/15 text-sky-100",
  email: "border-pink-300/30 bg-pink-300/15 text-pink-100",
  payments: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
  monitoring: "border-orange-300/30 bg-orange-300/15 text-orange-100",
  queue: "border-indigo-300/30 bg-indigo-300/15 text-indigo-100",
  realtime: "border-indigo-300/30 bg-indigo-300/15 text-indigo-100",
  ai: "border-fuchsia-300/30 bg-fuchsia-300/15 text-fuchsia-100",
  cms: "border-teal-300/30 bg-teal-300/15 text-teal-100",
  mobile: "border-rose-300/30 bg-rose-300/15 text-rose-100",
  devops: "border-slate-400/30 bg-slate-400/15 text-slate-200",
  testing: "border-lime-300/30 bg-lime-300/15 text-lime-100",
};

const difficultyDot: Record<ComponentDifficulty, string> = {
  beginner: "bg-emerald-400",
  intermediate: "bg-amber-400",
  advanced: "bg-rose-400",
};

const difficultyLabel: Record<ComponentDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const pricingColor: Record<ComponentPricing, string> = {
  free: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  freemium: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  paid: "border-rose-300/30 bg-rose-300/10 text-rose-200",
  "open-source": "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

const pricingLabel: Record<ComponentPricing, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
  "open-source": "Open Source",
};

export function ArchitectureNode({ data, selected }: NodeProps<ArchitectureFlowNode>) {
  const { component, shortReason, animationDelayMs, renderVersion } = data;
  const alternativesCount = component.alternatives.length;
  const risksCount = component.risks.length;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-0 !bg-cyan-300"
      />
      <motion.article
        key={`${component.name}-${renderVersion}`}
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: animationDelayMs / 1000,
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
            {component.name}
          </h3>
          <Badge
            variant="secondary"
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${categoryColor[component.category]}`}
          >
            {categoryLabel[component.category]}
          </Badge>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200">
          <Cpu className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <span className="line-clamp-1 font-medium">{component.tech}</span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{shortReason}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span>{alternativesCount} alt.</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-amber-300" />
              {risksCount} risks
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <span className={`h-2 w-2 rounded-full ${difficultyDot[component.difficulty]}`} />
              {difficultyLabel[component.difficulty]}
            </span>
            <span className="h-3 w-px bg-slate-600" />
            <Badge
              variant="secondary"
              className={`rounded-full border px-1.5 py-0 text-[10px] font-medium ${pricingColor[component.pricing]}`}
            >
              {pricingLabel[component.pricing]}
            </Badge>
          </div>
        </div>
      </motion.article>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-0 !bg-cyan-300"
      />
    </>
  );
}
