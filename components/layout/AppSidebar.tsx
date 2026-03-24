'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Layers, LogOut, MessageSquare, Search, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { deleteProject } from '@/lib/firebase/projects'
import { deleteChatConversation } from '@/lib/firebase/chats'
import type { Project } from '@/types/project'
import type { ChatConversation } from '@/types/chat'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

type PendingDelete =
  | { type: 'project'; id: string; title: string }
  | { type: 'chat'; id: string; title: string }

export function AppSidebar({
  projects,
  chats,
  searchQuery,
  onSearchChange,
  onChatSelect,
}: {
  projects: Project[]
  chats: ChatConversation[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onChatSelect: (chat: ChatConversation) => void
}) {
  const { user, firstName } = useAuth()
  const router = useRouter()
  const displayName =
    firstName || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const initial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  async function handleSignOut() {
    if (auth) await signOut(auth)
    router.push('/login')
  }

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = [...projects]
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.techStackArray.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      if (pendingDelete.type === 'project') {
        await deleteProject(pendingDelete.id)
      } else {
        await deleteChatConversation(pendingDelete.id)
      }
    } catch (err) {
      console.error('[Sidebar] delete failed', err)
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <>
      <Sidebar
        collapsible="icon"
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
          {/* Learn link */}
          <div className="px-3 pt-1 pb-1">
            <Link
              href="/learn"
              className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-400 transition-all hover:border-white/15 hover:bg-white/8 hover:text-slate-200 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-2"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
              <span className="group-data-[state=collapsed]:hidden">Lernen & Docs</span>
            </Link>
          </div>

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

          {/* Projekte */}
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
                      <div className="group/item flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <Link
                          href={`/project/${project.id}`}
                          className="flex-1 min-w-0 text-xs leading-snug line-clamp-1"
                        >
                          {project.title}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setPendingDelete({ type: 'project', id: project.id, title: project.title })
                          }}
                          className="shrink-0 ml-1 rounded p-0.5 text-slate-700 opacity-0 transition-all group-hover/item:opacity-100 hover:!text-red-400 hover:bg-red-500/10 group-data-[state=collapsed]:hidden"
                          title="Projekt löschen"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Freie Fragen */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] text-slate-600">Freie Fragen</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.length === 0 ? (
                  <p className="px-4 py-4 text-center text-xs text-slate-600 group-data-[state=collapsed]:hidden">
                    Noch keine Chats
                  </p>
                ) : (
                  chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <div className="group/item flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors cursor-pointer">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-fuchsia-500/70" />
                        <button
                          type="button"
                          onClick={() => onChatSelect(chat)}
                          className="flex-1 min-w-0 text-left text-xs leading-snug line-clamp-1"
                        >
                          {chat.title}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPendingDelete({ type: 'chat', id: chat.id, title: chat.title })
                          }}
                          className="shrink-0 ml-1 rounded p-0.5 text-slate-700 opacity-0 transition-all group-hover/item:opacity-100 hover:!text-red-400 hover:bg-red-500/10 group-data-[state=collapsed]:hidden"
                          title="Chat löschen"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
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
              onClick={handleSignOut}
              className="shrink-0 rounded-md p-1 text-slate-600 transition-colors hover:bg-white/5 hover:text-slate-300 group-data-[state=collapsed]:hidden"
              title="Abmelden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !deleting && setPendingDelete(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 className="h-4 w-4 text-red-400" />
              </div>
              <h2 className="text-base font-semibold text-slate-50">
                {pendingDelete.type === 'project' ? 'Projekt löschen' : 'Chat löschen'}
              </h2>
            </div>
            <p className="mb-5 mt-3 text-sm text-slate-400">
              <span className="font-medium text-slate-200">&ldquo;{pendingDelete.title}&rdquo;</span>{' '}
              wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 bg-white/4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200 disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/15 py-2.5 text-sm font-semibold text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/25 disabled:opacity-50"
              >
                {deleting ? 'Löschen…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
