"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogOut,
  Save,
  Check,
  User,
  Mail,
  Shield,
  Camera,
} from "lucide-react";
import { updateProfile, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserProfile } from "@/lib/firebase/users";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { GlowCard } from "@/components/ui/glow-card";
import { GlowInput } from "@/components/ui/glow-input";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, loading: authLoading, firstName: storedFirstName } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [avatarHovered, setAvatarHovered] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (storedFirstName) {
      setFirstName(storedFirstName);
    } else if (user?.displayName) {
      setFirstName(user.displayName);
    }
  }, [storedFirstName, user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      setSaveError("Vorname darf nicht leer sein.");
      setSaveState("error");
      return;
    }
    if (!auth?.currentUser) return;

    setSaving(true);
    setSaveError("");
    setSaveState("saving");
    try {
      await Promise.all([
        updateProfile(auth.currentUser, { displayName: firstName.trim() }),
        saveUserProfile(user!.uid, firstName.trim()),
      ]);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (auth) await signOut(auth);
    router.push("/login");
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Unbekannt";

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="mx-auto max-w-xl px-4 py-8 space-y-4">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Einstellungen</h1>
          <p className="text-sm text-white/40 mt-1">Verwalte dein Konto und dein Profil</p>
        </div>

        {/* Profile Card */}
        <GlowCard>
          <div className="p-6">
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <User className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-white/90 tracking-wide">Profil</span>
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setAvatarHovered(true)}
                onMouseLeave={() => setAvatarHovered(false)}
              >
                {/* Outer glow ring */}
                <div
                  className={cn(
                    "absolute -inset-0.5 rounded-full transition-all duration-500",
                    "bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-600",
                    avatarHovered ? "opacity-100 blur-sm" : "opacity-30"
                  )}
                />
                {/* Avatar circle */}
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center overflow-hidden">
                  <span className="text-lg font-semibold text-white z-10">{initial}</span>
                  {/* Hover overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200",
                      avatarHovered ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <GlowInput
                label="Vorname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Dein Vorname"
              />

              <GlowInput
                label="E-Mail"
                icon={<Mail className="w-3.5 h-3.5" />}
                type="email"
                value={user?.email ?? ""}
                disabled
                hint="E-Mail-Adresse kann derzeit nicht geändert werden."
              />

              {/* Feedback */}
              {saveState === "error" && saveError && (
                <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {saveError}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                    "transition-all duration-200 overflow-hidden",
                    "shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    saveState === "saved"
                      ? "bg-green-500/20 border border-green-500/30 text-green-400"
                      : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white"
                  )}
                >
                  {saveState === "saved" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Gespeichert
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Speichern…
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Speichern
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </GlowCard>

        {/* Account / Danger Zone Card */}
        <GlowCard>
          <div className="p-6">
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20">
                <Shield className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-sm font-semibold text-white/90 tracking-wide">Konto</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white/80">Abmelden</p>
                <p className="text-xs text-white/30 mt-0.5">Du wirst aus deinem Konto abgemeldet.</p>
              </div>
              <button
                onClick={handleSignOut}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium",
                  "bg-red-500/10 border border-red-500/20 text-red-400",
                  "hover:bg-red-500/20 hover:border-red-500/40",
                  "transition-all duration-200"
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
                Abmelden
              </button>
            </div>
          </div>
        </GlowCard>
      </main>
    </div>
  );
}
