"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  LogOut,
  Save,
  Check,
  Mail,
  Shield,
  User,
  Palette,
  Bell,
  Puzzle,
  CreditCard,
  AlertTriangle,
  Camera,
  Lock,
  Sun,
  Moon,
  Monitor,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { updateProfile, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserProfile } from "@/lib/firebase/users";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { GlowInput } from "@/components/ui/glow-input";
import { cn } from "@/lib/utils";

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabId = "profile" | "appearance" | "notifications" | "integrations" | "billing" | "danger";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "appearance", label: "Darstellung", icon: Palette },
  { id: "notifications", label: "Benachrichtigungen", icon: Bell },
  { id: "integrations", label: "Integrationen", icon: Puzzle },
  { id: "billing", label: "Abrechnung", icon: CreditCard },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({
  user,
  storedFirstName,
}: {
  user: import("firebase/auth").User;
  storedFirstName: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [avatarHover, setAvatarHover] = useState(false);

  useEffect(() => {
    if (storedFirstName) {
      setFirstName(storedFirstName);
    } else if (user?.displayName) {
      const parts = user.displayName.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
    }
  }, [storedFirstName, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      setSaveError("Vorname darf nicht leer sein.");
      setSaveState("error");
      return;
    }
    if (!auth?.currentUser) return;
    setSaveError("");
    setSaveState("saving");
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      await Promise.all([
        updateProfile(auth.currentUser, { displayName: fullName }),
        saveUserProfile(user.uid, firstName.trim()),
      ]);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      setSaveState("error");
    }
  }

  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Unbekannt";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white">Profil</h2>
        <p className="text-sm text-white/40 mt-0.5">Verwalte deine persönlichen Informationen</p>
      </div>

      {/* Glass card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="p-6">
          {/* Avatar area */}
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/[0.05]">
            <div
              className="relative cursor-pointer"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              {/* Glow ring */}
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-violet-500 via-violet-400 to-indigo-500 opacity-50 blur-sm" />
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-bold text-white">{initial}</span>
                {/* Hover overlay */}
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center gap-1",
                    "bg-black/60 backdrop-blur-sm rounded-full transition-opacity duration-200",
                    avatarHover ? "opacity-100" : "opacity-0",
                  )}
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span className="text-[9px] font-medium text-white/80 leading-none">Foto ändern</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{displayName}</p>
              <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-[10px] font-medium text-violet-300">Free Plan</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <GlowInput
                label="Vorname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Max"
              />
              <GlowInput
                label="Nachname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mustermann"
              />
            </div>

            <GlowInput
              label="E-Mail"
              icon={<Lock className="w-3.5 h-3.5" />}
              type="email"
              value={user?.email ?? ""}
              disabled
              hint="E-Mail-Adresse kann derzeit nicht geändert werden."
            />

            {saveState === "error" && saveError && (
              <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {saveError}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saveState === "saving"}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                  "transition-all duration-200",
                  "shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  saveState === "saved"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-gradient-to-r from-violet-600 to-violet-500 hover:opacity-90 text-white",
                )}
              >
                {saveState === "saved" ? (
                  <><Check className="w-3.5 h-3.5" /> Gespeichert</>
                ) : saveState === "saving" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Speichern…</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Speichern</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

const THEMES = [
  { id: "dark", label: "Dunkel", icon: Moon },
  { id: "light", label: "Hell", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
] as const;

const ACCENT_COLORS = [
  { id: "violet", label: "Violet", bg: "bg-violet-500", ring: "ring-violet-400" },
  { id: "blue", label: "Blau", bg: "bg-blue-500", ring: "ring-blue-400" },
  { id: "emerald", label: "Grün", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", ring: "ring-rose-400" },
  { id: "orange", label: "Orange", bg: "bg-orange-500", ring: "ring-orange-400" },
  { id: "cyan", label: "Cyan", bg: "bg-cyan-500", ring: "ring-cyan-400" },
] as const;

function AppearanceSection() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [accent, setAccent] = useState<string>("violet");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white">Darstellung</h2>
        <p className="text-sm text-white/40 mt-0.5">Passe das Erscheinungsbild der App an</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm divide-y divide-white/[0.04]">
        {/* Theme */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-white/80">Farbschema</p>
            <p className="text-xs text-white/30 mt-0.5">Wähle zwischen hellem, dunklem oder Systemmodus</p>
          </div>
          <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  theme === id
                    ? "bg-violet-500/20 border border-violet-500/30 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-white/80">Akzentfarbe</p>
            <p className="text-xs text-white/30 mt-0.5">Wähle eine Akzentfarbe für die Benutzeroberfläche</p>
          </div>
          <div className="flex gap-3">
            {ACCENT_COLORS.map(({ id, label, bg, ring }) => (
              <button
                key={id}
                onClick={() => setAccent(id)}
                title={label}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-200",
                  bg,
                  accent === id
                    ? `ring-2 ring-offset-2 ring-offset-[#0a0b14] ${ring} scale-110`
                    : "opacity-60 hover:opacity-100 hover:scale-105",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Coming Soon placeholder ────────────────────────────────────────

function ComingSoonSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/40 mt-0.5">{description}</p>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-4">
            <div className="w-2 h-2 rounded-full bg-violet-500/60" />
          </div>
          <p className="text-sm font-medium text-white/50">Demnächst verfügbar</p>
          <p className="text-xs text-white/25 mt-1">Dieser Bereich befindet sich noch in der Entwicklung.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Danger Zone ─────────────────────────────────────────────────────

function DangerSection({ onSignOut }: { onSignOut: () => void }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white">Danger Zone</h2>
        <p className="text-sm text-white/40 mt-0.5">Irreversible Aktionen — bitte sorgfältig vorgehen</p>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] backdrop-blur-sm divide-y divide-red-500/10">
        {/* Delete account */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">Konto löschen</p>
            <p className="text-xs text-white/30 mt-0.5">
              Löscht dein Konto und alle damit verbundenen Daten dauerhaft.
            </p>
          </div>
          {deleteConfirm ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-red-300/70">Sicher?</span>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 transition-all"
              >
                Abbrechen
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all">
                Löschen
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-red-500/25 text-red-400/80 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Konto löschen
            </button>
          )}
        </div>

        {/* Sign out */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">Abmelden</p>
            <p className="text-xs text-white/30 mt-0.5">Du wirst aus deinem Konto abgemeldet.</p>
          </div>
          <button
            onClick={onSignOut}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:bg-white/[0.04] hover:border-white/20 hover:text-white/80 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, loading: authLoading, firstName: storedFirstName } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  async function handleSignOut() {
    if (auth) await signOut(auth);
    router.push("/login");
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0b14]">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -left-60 -top-20 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute -right-60 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/6 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/4 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Einstellungen</h1>
          <p className="text-sm text-white/40 mt-1">Verwalte dein Konto und deine Präferenzen</p>
        </div>

        {/* Layout: sidebar + content */}
        <div className="flex gap-6">
          {/* ── Vertical tab nav ── */}
          <nav className="w-48 shrink-0 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              const isDanger = id === "danger";
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                    active
                      ? isDanger
                        ? "bg-red-500/10 text-red-300 border border-red-500/20"
                        : "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      : isDanger
                        ? "text-red-400/60 hover:bg-red-500/5 hover:text-red-400/80 border border-transparent"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70 border border-transparent",
                  )}
                >
                  {/* Active left accent bar */}
                  {active && (
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full",
                        isDanger ? "bg-red-400" : "bg-violet-400",
                      )}
                    />
                  )}
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-colors",
                      active
                        ? isDanger
                          ? "text-red-400"
                          : "text-violet-400"
                        : "text-white/30 group-hover:text-white/50",
                    )}
                  />
                  <span className="font-medium">{label}</span>
                  {active && (
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 ml-auto shrink-0",
                        isDanger ? "text-red-400/50" : "text-violet-400/50",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Content area ── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {activeTab === "profile" && (
                  <ProfileSection user={user} storedFirstName={storedFirstName} />
                )}
                {activeTab === "appearance" && <AppearanceSection />}
                {activeTab === "notifications" && (
                  <ComingSoonSection
                    title="Benachrichtigungen"
                    description="Verwalte deine Benachrichtigungseinstellungen"
                  />
                )}
                {activeTab === "integrations" && (
                  <ComingSoonSection
                    title="Integrationen"
                    description="Verbinde Venator mit anderen Tools und Diensten"
                  />
                )}
                {activeTab === "billing" && (
                  <ComingSoonSection
                    title="Abrechnung"
                    description="Verwalte dein Abonnement und deine Rechnungen"
                  />
                )}
                {activeTab === "danger" && <DangerSection onSignOut={handleSignOut} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Version badge */}
      <div className="fixed bottom-4 right-4 text-[10px] font-mono text-white/20 select-none">
        v0.0.7
      </div>
    </div>
  );
}
