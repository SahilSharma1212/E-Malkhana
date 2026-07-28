'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import {
  LayoutGrid,
  Search,
  QrCode,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Officer = {
  name?: string;
  role?: string;
  thana?: string;
  email?: string;
};

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { href: '/search-property', label: 'Search Records', icon: Search },
  { href: '/scanner', label: 'QR Scanner', icon: QrCode },
];

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
            )}
          >
            {/* Active marker uses the amber signal — the one accent on the rail. */}
            <span
              className={cn(
                'absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-sm bg-sidebar-primary transition-all',
                active ? 'w-1' : 'w-0'
              )}
              aria-hidden
            />
            <Icon strokeWidth={1.75} className="size-4.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <Image
        src="/CG_POLICE_LOGO.png"
        alt="Chhattisgarh Police"
        width={30}
        height={30}
        className="object-contain"
      />
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-wide text-white">E-MALKHANA</p>
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-sidebar-foreground/70">
          Evidence Console
        </p>
      </div>
    </div>
  );
}

function OfficerCard({
  officer,
  onSignOut,
  signingOut,
}: {
  officer: Officer | null;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <div className="mt-auto border-t border-sidebar-border px-3 py-3">
      {officer && (
        <div className="mb-2 flex items-center gap-2.5 rounded-sm px-2 py-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-sm bg-sidebar-accent text-sidebar-accent-foreground">
            <ShieldCheck className="size-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium capitalize text-white">
              {officer.name || officer.email || 'Officer'}
            </p>
            <p className="truncate text-[0.7rem] capitalize text-sidebar-foreground/70">
              {[officer.role, officer.thana].filter(Boolean).join(' · ') || 'Signed in'}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={onSignOut}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-60"
      >
        {signingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" strokeWidth={1.75} />
        )}
        Sign out
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    axios
      .get('/api/get-token', { withCredentials: true })
      .then((res) => {
        if (active && res.data?.authenticated) setOfficer(res.data.user as Officer);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const res = await axios.post('/api/sign-out', {}, { withCredentials: true });
      if (res.data?.success) {
        toast.success('Signed out');
        router.push('/sign-in');
      }
    } catch {
      toast.error('Sign-out failed');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar lg:flex">
        <Wordmark />
        <div className="mt-2 flex-1 overflow-y-auto scrollbar-hidden">
          <NavList pathname={pathname} />
        </div>
        <OfficerCard officer={officer} onSignOut={handleSignOut} signingOut={signingOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-3 py-2.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="grid size-9 place-items-center rounded-sm text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/CG_POLICE_LOGO.png"
              alt="Chhattisgarh Police"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="text-sm font-semibold tracking-wide text-white">E-MALKHANA</span>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="mr-3 grid size-9 place-items-center rounded-sm text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-2 flex-1 overflow-y-auto scrollbar-hidden">
              <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <OfficerCard officer={officer} onSignOut={handleSignOut} signingOut={signingOut} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
