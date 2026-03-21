"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, LogOut, Save, User } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (user?.displayName) {
      setFirstName(user.displayName);
    }
  }, [user]);

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
      await updateProfile(auth.currentUser, { displayName: firstName.trim() });
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/6 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/6 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>

        <h1 className="mb-8 text-2xl font-bold text-slate-100">Einstellungen</h1>

        {/* Profile section */}
        <section className="mb-6 rounded-2xl border border-white/8 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Profil</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
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
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400" htmlFor="email">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-600">E-Mail-Adresse kann nicht geändert werden.</p>
            </div>

            {saveError && (
              <p className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                Profil erfolgreich gespeichert.
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Speichern
              </button>
            </div>
          </form>
        </section>

        {/* Account section */}
        <section className="rounded-2xl border border-red-400/15 bg-slate-900/60 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Konto</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Abmelden</p>
              <p className="text-xs text-slate-600">Von deinem Konto abmelden</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
