"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/ui/venator-landing";
import { Pricing } from "@/components/ui/pricing";
import { FeatureSteps } from "@/components/ui/feature-section";
import {
  Brain,
  CheckCircle2,
  GitBranch,
  Shield,
  Zap,
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";


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
      <section id="pricing" className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <Pricing
          title="Simple, Transparent Pricing"
          description={`Choose the plan that fits your architecture needs.\nUnlock advanced AI capabilities and team collaboration as you grow.`}
          plans={[
            {
              name: "STARTER",
              price: "0",
              yearlyPrice: "0",
              period: "per month",
              features: [
                "Up to 3 architecture projects",
                "Basic AI recommendations",
                "PNG exports for graphs",
                "Community support",
                "Standard templates",
              ],
              description: "Perfect for students and beginners exploring software architecture",
              buttonText: "Start Free",
              href: "/signup",
              isPopular: false,
            },
            {
              name: "PRO",
              price: "19",
              yearlyPrice: "15",
              period: "per month",
              features: [
                "Unlimited architecture projects",
                "Advanced Claude AI",
                "Interactive React Flow exports",
                "Priority email support",
                "Save custom templates",
                "Downloadable markdown reports",
              ],
              description: "Ideal for professional developers and freelancers",
              buttonText: "Upgrade to Pro",
              href: "/signup",
              isPopular: true,
            },
            {
              name: "TEAM",
              price: "49",
              yearlyPrice: "39",
              period: "per month",
              features: [
                "Everything in Pro",
                "Team collaboration & sharing",
                "Custom AI knowledge base",
                "1-hour support response time",
                "SSO Authentication",
                "Advanced security",
              ],
              description: "For agencies and teams collaborating on complex systems",
              buttonText: "Contact Sales",
              href: "/contact",
              isPopular: false,
            },
          ]}
        />
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
