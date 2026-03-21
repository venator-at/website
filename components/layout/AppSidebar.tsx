'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Layers, LogOut, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import type { Project } from '@/types/project'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

async function handleFirebaseSignOut() {
  if (auth) await signOut(auth)
}

export function AppSidebar({
  projects,
  searchQuery,
  onSearchChange,
}: {
  projects: Project[]
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  const { user, firstName } = useAuth()
  const displayName =
    firstName || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  const filtered = [...projects]
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.techStackArray.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <Sidebar
      collapsible="icon"
      // Override --sidebar CSS variable so bg-sidebar = #0a0a0f
      style={{ '--sidebar': '#0a0a0f' } as React.CSSProperties}
      className="border-r border-white/5"
    >
      {/* Logo */}
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <Image
            src="/logo.png"
            alt="Venator"
            width={28}
            height={28}
            className="shrink-0 rounded-lg"
          />
          <span className="truncate text-sm font-semibold text-slate-200 group-data-[state=collapsed]:hidden">
            Venator
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Search — hidden when collapsed */}
        <div className="px-3 pb-2 group-data-[state=collapsed]:hidden">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-shadow focus-within:ring-1 focus-within:ring-violet-500/50">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="text"
              placeholder="Projekte suchen…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] text-slate-600">Projekte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filtered.length === 0 ? (
                <p className="px-4 py-4 text-center text-xs text-slate-600 group-data-[state=collapsed]:hidden">
                  Noch keine Projekte
                </p>
              ) : (
                filtered.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      render={<Link href={`/project/${project.id}`} />}
                      tooltip={project.title}
                      className="rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    >
                      <Layers className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="line-clamp-1 text-xs leading-snug">{project.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/20 text-xs font-bold text-violet-300">
            {initial}
          </div>
          <div className="flex min-w-0 flex-1 flex-col group-data-[state=collapsed]:hidden">
            <span className="truncate text-xs font-medium text-slate-200">{displayName}</span>
            <span className="truncate text-[10px] text-slate-500">{user?.email}</span>
          </div>
          <button
            onClick={handleFirebaseSignOut}
            className="shrink-0 rounded-md p-1 text-slate-600 transition-colors hover:bg-white/5 hover:text-slate-300 group-data-[state=collapsed]:hidden"
            title="Abmelden"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
