"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LandingPage } from "@/components/ui/venator-landing";
import { FeatureSteps } from "@/components/ui/feature-section";
import {
  Brain,
  Check,
  CheckCircle2,
  GitBranch,
  Lightbulb,
  ListChecks,
  Shield,
  Workflow,
  Zap,
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Footer2 } from "@/components/ui/footer2";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";


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
            title: "1. Idee beschreiben",
            description:
              "Beschreibe dein Projekt in einfachen Worten, lege dein Skill-Level und Budget fest. Die KI analysiert deine Anforderungen in Sekunden.",
            tags: ["Input", "KI-Analyse"],
            imageContent: (
              <Lightbulb className="h-12 w-12 text-cyan-400/70" strokeWidth={1.5} />
            ),
          },
          {
            title: "2. Geführte Auswahl",
            description:
              "Keine Überforderung. Wähle Frontend, Datenbank & Hosting basierend auf objektiven KI-Analysen, verständlichen Vor-/Nachteilen und Anfängerfreundlichkeit.",
            tags: ["Wizard", "Begründungen"],
            imageContent: (
              <ListChecks className="h-12 w-12 text-cyan-400/70" strokeWidth={1.5} />
            ),
          },
          {
            title: "3. Architektur visualisieren",
            description:
              "Dein fertiger Tech-Stack wird als interaktiver Graph dargestellt. Exportiere deinen Plan, erhalte Starter-Code und beginne direkt mit der Umsetzung.",
            tags: ["React Flow", "Export"],
            imageContent: (
              <Workflow className="h-12 w-12 text-cyan-400/70" strokeWidth={1.5} />
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

      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <FeatureSteps
          title="Your Path to a Solid Tech Stack"
          autoPlayInterval={4000}
          imageHeight="h-[400px] lg:h-[500px]"
          features={[
            {
              step: "Step 1",
              title: "Describe Your Idea",
              content: "Tell us what you want to build. Venator analyzes your project type, experience level, and overall requirements to set the baseline.",
              image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop",
            },
            {
              step: "Step 2",
              title: "Interactive Planning",
              content: "A guided, step-by-step wizard helps you navigate complex architectural choices like your Backend, Database, and Infrastructure.",
              image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop",
            },
            {
              step: "Step 3",
              title: "AI Recommendations",
              content: "Get tailored technology suggestions directly from Claude, complete with detailed pros, cons, and beginner-friendly reasoning for every choice.",
              image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2070&auto=format&fit=crop",
            },
            {
              step: "Step 4",
              title: "Visualize & Export",
              content: "See your complete architecture as a dynamic React Flow graph and download a production-ready tech stack report to start coding immediately.",
              image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
            },
          ]}
        />
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
            Everything you need to plan right
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Built for beginners and junior developers who want to make decisions they can stand behind.
          </p>
        </div>

        <BentoGrid className="lg:grid-rows-3">
          <BentoCard
            name="AI-powered analysis"
            description="Claude AI reads your project description and tailors every recommendation to your specific use case, experience level, and budget."
            Icon={Brain}
            href="/signup"
            cta="Get started"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
            }
            className="lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3"
          />
          <BentoCard
            name="Honest trade-offs"
            description="No vendor bias. Every option comes with clear pros, cons, and real risks — so you can make an informed choice, not just follow the hype."
            Icon={CheckCircle2}
            href="/signup"
            cta="Learn more"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            }
            className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3"
          />
          <BentoCard
            name="Beginner-first language"
            description="Every explanation is written in plain language. No jargon without definition, no assumed knowledge, no gatekeeping."
            Icon={Shield}
            href="/signup"
            cta="Learn more"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
            }
            className="lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4"
          />
          <BentoCard
            name="Interactive graph"
            description="Your entire architecture in one visual canvas. Drag nodes, explore connections, click for details, and export as PNG or SVG."
            Icon={GitBranch}
            href="/dashboard"
            cta="See demo"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />
            }
            className="lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2"
          />
          <BentoCard
            name="Guided wizard"
            description="One decision at a time. The wizard format prevents overwhelm and keeps you moving forward, not paralyzed."
            Icon={Zap}
            href="/signup"
            cta="Try it"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
            }
            className="lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4"
          />
        </BentoGrid>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="relative mx-auto max-w-5xl px-4 py-28 lg:px-8">
        {/* Section label */}
        <div className="mb-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/30" />
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Pricing
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/30" />
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Bezahle nur für das, was du wirklich nutzt. Kein Abo, kein Risiko.
          </p>
        </div>

        {/* 2-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* ── Left card: Free ─────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Der erste Entwurf geht auf uns
            </p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-5xl font-bold text-slate-50">0€</span>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Teste Venator völlig risikofrei.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "1 Projekt-Architektur komplett gratis planen",
                "Basis-Exportfunktionen",
                "Interaktiver Architektur-Graph",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full font-semibold border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-50"
              )}
            >
              Gratis starten
            </Link>
          </div>

          {/* ── Right card: Pay-As-You-Go (highlighted) ─────────────── */}
          <div className="relative rounded-2xl border border-cyan-500/50 bg-slate-900/70 backdrop-blur-sm p-8 flex flex-col shadow-[0_0_50px_-12px_rgba(34,211,238,0.3)]">
            {/* Subtle inner glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent" />

            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4">
              Pay-As-You-Go System
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-slate-50">Ab 5€</span>
            </div>
            <p className="text-slate-400 text-xs mb-2">Einmalzahlung · kein Abo</p>
            <p className="text-slate-400 text-sm mb-6">
              Keine versteckten Kosten. Zahle nur für die KI-Leistung, die du wirklich nutzt.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Tokens verfallen nie",
                "1 Komplette Architektur = ca. 10 Tokens",
                "Einzelne Refactorings = 2 Tokens",
                "Unbegrenzt Projekte speichern & exportieren",
                "Bezahlung sicher via Stripe",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900",
                "shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.65)]",
                "transition-all duration-300"
              )}
            >
              Guthaben aufladen
            </Link>
          </div>

        </div>
      </section>

{/* ─── FOOTER ───────────────────────────────────────────────── */}
      <Footer2 />
    </div>
  );
}
