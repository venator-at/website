'use client';
import React from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu';
import { LayoutDashboard, LogOut, Settings, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

async function handleFirebaseSignOut() {
  if (auth) await signOut(auth);
}

// ─── Scroll hook ──────────────────────────────────────────────────────────────

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}

// ─── Mobile menu portal ───────────────────────────────────────────────────────

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg',
        'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden',
      )}
    >
      <div
        data-slot={open ? 'open' : 'closed'}
        className={cn(
          'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
          'size-full p-4',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ─── User avatar ─────────────────────────────────────────────────────────────

function CreditsBadge({ credits }: { credits: number }) {
  const low = credits < 10;
  return (
    <Link
      href="/buy-credits"
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        low
          ? 'bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25'
          : 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20',
      )}
      title="Credits aufladen"
    >
      <Zap className="h-3 w-3" />
      {credits} Credits
    </Link>
  );
}

function UserAvatar({ displayName, email, credits }: { displayName: string | null; email: string | null; credits: number }) {
  const initial = (displayName?.[0] ?? email?.[0] ?? '?').toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <CreditsBadge credits={credits} />
      <button
        onClick={handleFirebaseSignOut}
        className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors md:flex"
        title="Abmelden"
      >
        <LogOut className="h-3.5 w-3.5" />
        Abmelden
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
        {initial}
      </div>
    </div>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────

export function DashboardHeader() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);
  const { user, credits } = useAuth();

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
        'bg-slate-950/95 supports-[backdrop-filter]:bg-slate-950/80 border-white/6 backdrop-blur-lg':
          scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 lg:px-6">
        {/* Desktop nav */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Einstellungen
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserAvatar displayName={user.displayName} email={user.email} credits={credits} />
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost' }))}
              >
                Anmelden
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ variant: 'default' }))}
              >
                Loslegen
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(!open)}
          className="md:hidden text-slate-400 hover:text-slate-200"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menü öffnen"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      {/* Mobile menu */}
      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-500" />
            Dashboard
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            Einstellungen
          </Link>
        </nav>

        <div className="flex flex-col gap-2 border-t border-white/6 pt-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  {(user.displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">
                    {user.displayName ?? user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent border-white/10 text-slate-300"
                onClick={handleFirebaseSignOut}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Abmelden
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center bg-transparent')}
              >
                Anmelden
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}
              >
                Loslegen
              </Link>
            </>
          )}
        </div>
      </MobileMenu>
    </header>
  );
}
