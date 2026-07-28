'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppShell from '@/components/AppShell';

// Pages that render outside the admin console: sign-in, the OTP stub, and the
// public QR landing page. Everything else gets the full sidebar shell.
const MINIMAL_ROUTES = new Set(['/', '/sign-in', '/otp-login']);

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/CG_POLICE_LOGO.png"
            alt="Chhattisgarh Police"
            width={28}
            height={28}
            className="object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide text-white">E-MALKHANA</p>
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-sidebar-foreground/70">
              Chhattisgarh Police · Evidence Console
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default function LayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';

  if (MINIMAL_ROUTES.has(pathname)) {
    return (
      <div className="min-h-screen bg-background">
        <MinimalHeader />
        <main>{children}</main>
        <Toaster position="top-right" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
