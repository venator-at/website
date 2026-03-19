"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/ui/venator-landing";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  GitBranch,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="relative overflow-x-hidden bg-background text-foreground">
      {/* ─── HERO (Aurora animated section) ──────────────────────── */}
      <LandingPage
        logo={{ initials: "VN", name: "Venator" }}
        navLinks={[
          { label: "Overview", href: "#about" },
          { label: "Features", href: "#features" },
          { label: "How it Works", href: "#how-it-works" },
        ]}
        actionButton={{
          label: "Login",
          onClick: () => router.push("/login"),
        }}
        hero={{
          titleLine1: "Design your app's",
          titleLine2Gradient: "Architecture with AI",
          subtitle:
            "Venator takes your project idea and builds a comprehensive tech stack and visual architecture graph tailored to your needs.",
        }}
        ctaButtons={{
          primary: {
            label: "Start Planning Free",
            onClick: () => router.push("/signup"),
          },
          secondary: {
            label: "View Dashboard",
            onClick: () => router.push("/dashboard"),
          },
        }}
        features={[
          {
            title: "Next.js App Router",
            description:
              "Built with the latest React Server Components and Server Actions for optimal performance.",
            tags: ["Next.js 15", "TypeScript"],
            imageContent: (
              <div className="text-4xl font-bold text-white/20 select-none">
                ▲
              </div>
            ),
          },
          {
            title: "Supabase Integration",
            description:
              "Seamless authentication and PostgreSQL database setup out of the box.",
            tags: ["Auth", "PostgreSQL"],
            imageContent: (
              <div className="text-4xl text-white/20 select-none">⚡</div>
            ),
          },
          {
            title: "Claude AI Powered",
            description:
              "Leveraging Anthropic's Claude to provide expert architectural advice tailored to your project.",
            tags: ["AI", "Anthropic API"],
            imageContent: (
              <div className="text-4xl text-white/50 select-none">✨</div>
            ),
          },
        ]}
        stats={[
          { value: "Step-by-Step", label: "Guided Planning" },
          { value: "AI Generated", label: "Architecture Graphs" },
          { value: "Production", label: "Ready Tech Stacks" },
        ]}
        showAnimatedBackground={true}
      />

      {/* ─── WHY WE BUILT THIS ────────────────────────────────────── */}
      <section id="why" className="relative mx-auto max-w-5xl px-4 py-28 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/30" />
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Why we built this
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/30" />
        </div>

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

          <p className="text-slate-300 font-medium">
            You shouldn&apos;t have to.
          </p>
        </div>

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
              icon: <GitBranch className="h-6 w-6 text-cyan-400" />,
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
      <section className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
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
