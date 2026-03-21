"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToProjects } from "@/lib/firebase/projects";
import type { Project } from "@/types/project";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardPage() {
  const { user, loading: authLoading, firstName } = useAuth();
  const router = useRouter();
  const firebaseConfigured = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ].every((value) => typeof value === "string" && value.trim().length > 0);

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router, firebaseConfigured]);

  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const unsub = subscribeToProjects(user.uid, setProjects);
    return unsub;
  }, [user, firebaseConfigured]);

  const handleSubmit = useCallback(() => {
    const idea = prompt.trim();
    if (!idea) return;
    router.push(`/new?q=${encodeURIComponent(idea)}`);
  }, [prompt, router]);

  const displayName =
    firstName ||
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <SidebarProvider className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-[120px]" />
      </div>

      <AppSidebar
        projects={projects}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <SidebarInset className="bg-slate-950 text-slate-100">
        {/* Floating navbar (fixed, doesn't affect layout flow) */}
        <DashboardHeader />

        <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
          <ElegantShape
            delay={0.3}
            width={500}
            height={120}
            rotate={12}
            gradient="from-cyan-500/[0.12]"
            className="pointer-events-none left-[-4%] top-[10%]"
          />
          <ElegantShape
            delay={0.5}
            width={400}
            height={100}
            rotate={-15}
            gradient="from-fuchsia-500/[0.12]"
            className="pointer-events-none right-[-2%] bottom-[15%]"
          />
          <ElegantShape
            delay={0.4}
            width={250}
            height={70}
            rotate={-8}
            gradient="from-indigo-500/[0.12]"
            className="pointer-events-none left-[5%] bottom-[5%]"
          />
          <ElegantShape
            delay={0.6}
            width={180}
            height={50}
            rotate={20}
            gradient="from-violet-500/[0.12]"
            className="pointer-events-none right-[18%] top-[5%]"
          />
          <ElegantShape
            delay={0.7}
            width={130}
            height={38}
            rotate={-25}
            gradient="from-sky-500/[0.12]"
            className="pointer-events-none left-[22%] top-[2%]"
          />

          <div className="relative z-10 w-full max-w-3xl">
            <VercelV0Chat
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              displayName={displayName}
            />
          </div>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
