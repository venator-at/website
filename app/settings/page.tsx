"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Save, Settings, User, Mail, ShieldAlert } from "lucide-react";
import { updateProfile, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserProfile } from "@/lib/firebase/users";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function SettingsPage() {
  const { user, loading: authLoading, firstName: storedFirstName } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Populate field from Firestore once loaded
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
      return;
    }
    if (!auth?.currentUser) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      // Save to Firebase Auth (for displayName) + Firestore (persistent, real-time)
      await Promise.all([
        updateProfile(auth.currentUser, { displayName: firstName.trim() }),
        saveUserProfile(user!.uid, firstName.trim()),
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/6 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/6 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="mx-auto max-w-2xl px-4 py-12 lg:px-6">
        {/* Page title */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-800/60">
            <Settings className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Einstellungen</h1>
            <p className="text-sm text-slate-500">Verwalte dein Konto und dein Profil</p>
          </div>
        </div>

        {/* Profile card */}
        <section className="mb-4 rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-white/6 px-6 py-4">
            <User className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Profil</h2>
          </div>

          <div className="p-6">
            {/* Avatar row */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xl font-bold">
                {initial}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {user?.displayName ?? user?.email?.split("@")[0] ?? "Unbekannt"}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              {/* First name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400" htmlFor="firstName">
                  Vorname
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Dein Vorname"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
                />
              </div>

              {/* Email (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400" htmlFor="email">
                  <Mail className="h-3 w-3" />
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="rounded-xl border border-white/6 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-600">E-Mail-Adresse kann derzeit nicht geändert werden.</p>
              </div>

              {/* Feedback */}
              {saveError && (
                <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {saveError}
                </p>
              )}
              {saveSuccess && (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                  Profil erfolgreich gespeichert.
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-5 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-500/20 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-red-500/10 px-6 py-4">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-slate-200">Konto</h2>
          </div>

          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-300">Abmelden</p>
              <p className="text-xs text-slate-500 mt-0.5">Du wirst aus deinem Konto abgemeldet.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
