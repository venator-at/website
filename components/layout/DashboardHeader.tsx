'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut, Settings, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { cn } from '@/lib/utils'

async function handleFirebaseSignOut() {
  if (auth) await signOut(auth)
}

function CreditsBadge({ credits }: { credits: number }) {
  const low = credits < 10
  return (
    <Link
      href="/buy-credits"
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
        low
          ? 'border border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25'
          : 'border border-violet-500/30 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25',
      )}
      title="Credits aufladen"
    >
      <Zap className="h-3.5 w-3.5 text-violet-400" />
      {credits} Credits
    </Link>
  )
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
]

export function DashboardHeader() {
  const pathname = usePathname()
  const { user, credits } = useAuth()
  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="pointer-events-none fixed top-4 left-0 right-0 z-50 flex justify-center">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-md">
        {/* Nav links */}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-all',
                active
                  ? 'bg-white/15 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                  : 'text-slate-400 hover:bg-white/8 hover:text-slate-200',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="mx-1 h-4 w-px bg-white/10" />

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-1.5 pl-1">
            <CreditsBadge credits={credits} />
            <button
              onClick={handleFirebaseSignOut}
              className="flex items-center rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-300"
              title="Abmelden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/20 text-xs font-bold text-violet-300">
              {initial}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pl-1">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
            >
              Anmelden
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-violet-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-violet-400"
            >
              Loslegen
            </Link>
          </div>
        )}
      </nav>
    </div>
  )
}
