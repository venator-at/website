"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  LogOut,
  Save,
  Check,
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
  ChevronLeft,
} from "lucide-react";
import { updateProfile, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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

// ─── Shared: Section header ───────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

// ─── Shared: Settings row ─────────────────────────────────────────────────────

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="shrink-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Shared: Danger row ───────────────────────────────────────────────────────

function DangerRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Shared: Save button ──────────────────────────────────────────────────────

function SaveButton({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  return (
    <button
      type="submit"
      disabled={state === "saving"}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
        "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
        state === "saved"
          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
          : "bg-gradient-to-r from-violet-600 to-violet-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]",
      )}
    >
      {state === "saved" ? (
        <><Check className="w-3.5 h-3.5" /> Gespeichert</>
      ) : state === "saving" ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Speichern…</>
      ) : (
        <><Save className="w-3.5 h-3.5" /> Speichern</>
      )}
    </button>
  );
}

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
    <div>
      <SectionHeader
        title="Profil"
        description="Verwalte deine persönlichen Informationen"
      />

      <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        {/* Avatar row */}
        <div className="p-6 flex items-center gap-5 border-b border-white/[0.05]">
          <div
            className="relative cursor-pointer shrink-0"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 opacity-40 blur-sm" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center overflow-hidden">
              <span className="text-xl font-bold text-white">{initial}</span>
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-0.5",
                  "bg-black/60 backdrop-blur-sm rounded-full transition-opacity duration-200",
                  avatarHover ? "opacity-100" : "opacity-0",
                )}
              >
                <Camera className="w-4 h-4 text-white" />
                <span className="text-[9px] font-medium text-white/80">ändern</span>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-[10px] font-medium text-violet-300">Free Plan</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
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
              <SaveButton state={saveState} />
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
  const { theme, accent, setTheme, setAccent } = useTheme();

  return (
    <div>
      <SectionHeader
        title="Darstellung"
        description="Passe das Erscheinungsbild der App an"
      />

      <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm divide-y divide-white/[0.04]">
        <SettingsRow
          label="Farbschema"
          description="Wähle zwischen hellem, dunklem oder Systemmodus"
        >
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                  theme === id
                    ? "bg-violet-500/20 border border-violet-500/30 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow
          label="Akzentfarbe"
          description="Wähle eine Akzentfarbe für die Benutzeroberfläche"
        >
          <div className="flex gap-3">
            {ACCENT_COLORS.map(({ id, label, bg, ring }) => (
              <button
                key={id}
                onClick={() => setAccent(id)}
                title={label}
                className={cn(
                  "w-7 h-7 rounded-full transition-all duration-200",
                  bg,
                  accent === id
                    ? `ring-2 ring-offset-2 ring-offset-[#0a0b14] ${ring} scale-110`
                    : "opacity-50 hover:opacity-90 hover:scale-105",
                )}
              />
            ))}
          </div>
        </SettingsRow>
      </div>
    </div>
  );
}

// ─── Section: Coming Soon placeholder ────────────────────────────────────────

function ComingSoonSection({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <SectionHeader title={title} description={description} />
      <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm">
        <div className="p-16 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-4">
            <div className="w-2 h-2 rounded-full bg-violet-500/50" />
          </div>
          <p className="text-sm font-medium text-slate-400">Demnächst verfügbar</p>
          <p className="text-xs text-slate-600 mt-1">Dieser Bereich befindet sich noch in der Entwicklung.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Danger Zone ─────────────────────────────────────────────────────

function DangerSection({ onSignOut }: { onSignOut: () => void }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div>
      <SectionHeader
        title="Danger Zone"
        description="Irreversible Aktionen — bitte sorgfältig vorgehen"
      />

      <div className="rounded-2xl border border-red-500/15 bg-red-950/20 backdrop-blur-sm divide-y divide-red-500/[0.08]">
        <DangerRow
          label="Konto löschen"
          description="Löscht dein Konto und alle damit verbundenen Daten dauerhaft."
        >
          {deleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sicher?</span>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20 transition-all"
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:border-red-500/35 hover:text-red-300 transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Löschen
            </button>
          )}
        </DangerRow>

        <DangerRow
          label="Abmelden"
          description="Du wirst aus deinem Konto abgemeldet."
        >
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:bg-white/[0.04] hover:border-white/20 hover:text-slate-200 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </button>
        </DangerRow>
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
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -left-60 -top-20 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute -right-60 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-500/6 blur-[140px]" />
      </div>

      <DashboardHeader />

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400">Einstellungen</span>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-100">Einstellungen</h1>
          <p className="text-sm text-slate-500 mt-1">Verwalte dein Konto und deine Präferenzen</p>
        </div>

        {/* Layout: sidebar + content */}
        <div className="flex gap-8">
          {/* Vertical tab nav */}
          <nav className="w-44 shrink-0 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              const isDanger = id === "danger";
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                    active
                      ? isDanger
                        ? "bg-red-500/10 text-red-300 border border-red-500/20"
                        : "bg-white/[0.06] text-slate-100 border border-white/[0.09]"
                      : isDanger
                        ? "text-red-400/50 hover:bg-red-500/[0.06] hover:text-red-400/80 border border-transparent"
                        : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 border border-transparent",
                  )}
                >
                  {/* Active accent bar */}
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
                        : isDanger
                          ? "text-red-500/40 group-hover:text-red-400/70"
                          : "text-slate-600 group-hover:text-slate-400",
                    )}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
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
      <div className="fixed bottom-4 right-4 text-[10px] font-mono text-white/15 select-none">
        v0.0.7
      </div>
    </div>
  );
}
