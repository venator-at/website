"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

// TODO: Replace isLoggedIn with real Supabase session check when auth is wired up
// e.g. const { data: { session } } = await supabase.auth.getSession()
interface SiteHeaderProps {
  isLoggedIn?: boolean;
}

export function SiteHeader({ isLoggedIn = false }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* backdrop blur bar */}
      <div className="relative border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-slate-100 hover:text-cyan-300 transition-colors"
          >
            <Image src="/logo.png" alt="Venator" width={32} height={32} className="rounded-lg" />
            Venator
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="#why"
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-md hover:bg-white/5"
            >
              Why Venator
            </Link>
            <Link
              href="#how-it-works"
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-md hover:bg-white/5"
            >
              How it works
            </Link>
            <Link
              href="#features"
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-md hover:bg-white/5"
            >
              Features
            </Link>
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/25 hover:border-cyan-400/50 transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 md:hidden transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-white/5 bg-background/95 px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="#why"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
              >
                Why Venator
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
              >
                How it works
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
              >
                Features
              </Link>
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 rounded-lg bg-cyan-400/15 border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900"
                  >
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
