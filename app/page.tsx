"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Layers,
  Map,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/header";

// TODO: Pass real session state from Supabase when auth is implemented
const IS_LOGGED_IN = false;

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ─── Global ambient glows ─────────────────────────────────── */}
      <div className="pointer-events-none fixed -left-60 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed -right-40 top-40 -z-10 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[80px]" />

      <SiteHeader isLoggedIn={IS_LOGGED_IN} />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-24 pt-36 text-center lg:px-8 lg:pt-44">
        {/* pill badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
          <Sparkles className="h-3 w-3" />
          AI-powered architecture advisor
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight text-slate-50 md:text-6xl lg:text-7xl text-balance">
          From idea to
          <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            perfect architecture
          </span>
          in minutes.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          Stop second-guessing every tech choice. Venator walks you through every architectural decision — with clear explanations and honest trade-offs — so you can build with confidence from day one.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-7 py-3.5 text-base font-bold text-slate-900 shadow-2xl shadow-cyan-500/30 hover:bg-cyan-400 transition-all"
          >
            Start planning for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#why"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-base font-medium text-slate-300 hover:bg-white/10 hover:text-slate-100 transition-all"
          >
            Why we built this
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* hero graphic — mock graph preview */}
        <div className="relative mt-20 w-full max-w-5xl">
          <div className="glass-panel neon-ring overflow-hidden rounded-2xl p-1">
            {/* fake browser chrome */}
            <div className="flex h-9 items-center gap-2 rounded-t-xl border-b border-white/5 bg-white/5 px-4">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
              <div className="ml-4 h-5 flex-1 max-w-xs rounded-full bg-white/5 px-3 flex items-center">
                <span className="text-[10px] text-slate-500">venator.app/dashboard</span>
              </div>
            </div>
            {/* mock graph canvas */}
            <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-b-xl bg-[oklch(0.15_0.018_254)] md:h-80">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06)_0%,transparent_70%)]" />
              {/* mock nodes */}
              <MockGraphPreview />
            </div>
          </div>
          {/* glow under preview */}
          <div className="pointer-events-none absolute -bottom-8 left-1/2 -z-10 h-32 w-3/4 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
        </div>
      </section>

      {/* ─── WHY WE BUILT THIS ────────────────────────────────────── */}
      <section id="why" className="relative mx-auto max-w-5xl px-4 py-28 lg:px-8">
        {/* section label */}
        <div className="mb-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/30" />
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Why we built this
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/30" />
        </div>

        {/* emotional headline */}
        <h2 className="max-w-3xl text-4xl font-bold leading-[1.2] tracking-tight text-slate-50 md:text-5xl text-balance">
          Every great idea deserves a real shot.
        </h2>

        <div className="mt-10 space-y-8 text-lg leading-relaxed text-slate-400">
          <p>
            We know the feeling. You have an idea that could genuinely help people. You sit down to build it. And then the questions start.
          </p>

          <blockquote className="relative border-l-2 border-cyan-400/50 pl-6 italic text-slate-300">
            <span className="text-slate-400">
              &ldquo;Which database should I use? Do I even need a backend? What if I pick the wrong framework and have to rewrite everything in six months?&rdquo;
            </span>
          </blockquote>

          <p>
            You open 30 browser tabs. You post on Reddit and get 20 different opinions. Hours disappear. Nothing gets built.
          </p>

          <p className="text-slate-300">
            We watched too many talented people give up — not because they couldn&apos;t code, not because their idea wasn&apos;t good enough — but because the gap between &ldquo;I have an idea&rdquo; and &ldquo;I know how to build it properly&rdquo; was too wide, too intimidating, and too expensive to cross alone.
          </p>

          <p>
            Architecture decisions shouldn&apos;t be gatekept behind years of experience. The <em>why</em> behind every tech choice is more valuable than the choice itself. When you understand why PostgreSQL fits your use case, you can defend that decision, adapt it, and grow with it.
          </p>

          <p className="text-xl font-medium text-slate-200">
            Venator was built to close that gap.
          </p>

          <p>
            We give you the same structured thinking that senior architects use — presented without jargon, without judgment, and without pretending there&apos;s one right answer. Because the best engineers in the world weren&apos;t born knowing this. They learned it, often the hard way.
          </p>

          <p className="text-slate-300 font-medium">
            You shouldn&apos;t have to.
          </p>
        </div>

        {/* pull-quote highlight */}
        <div className="mt-14 glass-panel neon-ring rounded-2xl p-8">
          <p className="text-2xl font-semibold leading-snug text-slate-100 text-balance md:text-3xl">
            &ldquo;The best tool for your project shouldn&apos;t require 10 years of experience to discover.&rdquo;
          </p>
          <p className="mt-4 text-sm text-slate-500">— The Venator team</p>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-fuchsia-300">
            Simple process
          </div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Three steps from blank page to production-ready architecture plan.
          </p>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* connecting line (desktop) */}
          <div className="pointer-events-none absolute left-[calc(50%/3*1+50%/3*0)] right-[calc(50%/3)] top-8 hidden h-px bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/30 to-cyan-400/30 md:block" />

          {[
            {
              step: "01",
              icon: <Brain className="h-6 w-6 text-cyan-400" />,
              title: "Describe your idea",
              body: "Tell us what you want to build in plain language. No technical background required — just your vision.",
            },
            {
              step: "02",
              icon: <Layers className="h-6 w-6 text-fuchsia-400" />,
              title: "Get AI recommendations",
              body: "Venator breaks your project into components and suggests 2–3 technology options for each — with honest pros, cons, and beginner-friendly explanations.",
            },
            {
              step: "03",
              icon: <Map className="h-6 w-6 text-cyan-400" />,
              title: "Visualize your architecture",
              body: "See your entire stack as an interactive, exportable graph. Share it, save it, and use it as your blueprint.",
            },
          ].map(({ step, icon, title, body }) => (
            <div key={step} className="glass-panel relative rounded-2xl p-8">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  {icon}
                </div>
                <span className="font-mono text-5xl font-bold text-white/5">{step}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
            Everything you need to plan right
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Built for beginners and junior developers who want to make decisions they can stand behind.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Brain className="h-5 w-5 text-cyan-400" />,
              title: "AI-powered analysis",
              body: "Claude AI reads your project description and tailors every recommendation to your specific use case, experience level, and budget.",
            },
            {
              icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
              title: "Honest trade-offs",
              body: "No vendor bias. Every option comes with clear pros, cons, and real risks — so you can make an informed choice, not just follow the hype.",
            },
            {
              icon: <GitBranch className="h-5 w-5 text-fuchsia-400" />,
              title: "Interactive graph",
              body: "Your entire architecture in one visual canvas. Drag nodes, explore connections, click for details, and export as PNG or SVG.",
            },
            {
              icon: <Shield className="h-5 w-5 text-amber-400" />,
              title: "Beginner-first language",
              body: "Every explanation is written in plain language. No jargon without definition, no assumed knowledge, no gatekeeping.",
            },
            {
              icon: <Zap className="h-5 w-5 text-cyan-400" />,
              title: "Guided wizard",
              body: "One decision at a time. The wizard format prevents overwhelm and keeps you moving forward, not paralyzed.",
            },
            {
              icon: <Layers className="h-5 w-5 text-fuchsia-400" />,
              title: "Exportable output",
              body: "Download your full architecture plan as a Markdown document or save your graph as an image. Your blueprint, ready to share.",
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="glass-panel group rounded-2xl p-7 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-cyan-400/20 transition-colors">
                {icon}
              </div>
              <h3 className="font-bold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="glass-panel neon-ring relative overflow-hidden rounded-3xl p-12 text-center md:p-20">
          {/* inner glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/0 via-cyan-300/60 to-cyan-300/0" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              <Sparkles className="h-3 w-3" />
              Free to start
            </div>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-50 md:text-5xl text-balance">
              Your next project deserves a solid foundation.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
              Join developers who plan smarter, build faster, and stop second-guessing their tech stack.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-base font-bold text-slate-900 shadow-2xl shadow-cyan-500/30 hover:bg-cyan-400 transition-all"
              >
                Start planning for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-slate-300 hover:bg-white/10 transition-all"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-600 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-slate-500">
            <Zap className="h-4 w-4 text-cyan-600" />
            Venator
          </div>
          <p>© {new Date().getFullYear()} Venator. Built for builders.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Mock graph nodes (visual only, no React Flow) ──────────── */
function MockGraphPreview() {
  const nodes = [
    { id: "fe", label: "Next.js", sub: "Frontend", x: "20%", y: "25%" },
    { id: "be", label: "Node.js", sub: "Backend", x: "50%", y: "25%" },
    { id: "db", label: "PostgreSQL", sub: "Database", x: "80%", y: "25%" },
    { id: "auth", label: "Supabase", sub: "Auth", x: "35%", y: "65%" },
    { id: "host", label: "Vercel", sub: "Hosting", x: "65%", y: "65%" },
  ];

  return (
    <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
      {/* edges */}
      <line x1="25%" y1="35%" x2="50%" y2="35%" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="55%" y1="35%" x2="78%" y2="35%" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="25%" y1="38%" x2="34%" y2="60%" stroke="rgba(167,139,250,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="55%" y1="38%" x2="64%" y2="60%" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* nodes */}
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
          <rect
            x="-44"
            y="-22"
            width="88"
            height="44"
            rx="10"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(34,211,238,0.25)"
            strokeWidth="1"
          />
          <text x="0" y="-4" textAnchor="middle" fill="rgb(226,232,240)" fontSize="11" fontWeight="600" fontFamily="Space Grotesk, sans-serif">
            {n.label}
          </text>
          <text x="0" y="11" textAnchor="middle" fill="rgb(100,116,139)" fontSize="9" fontFamily="Space Grotesk, sans-serif">
            {n.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}
