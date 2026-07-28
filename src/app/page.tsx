'use client';

import PropertyForm from '@/components/PropertyForm';
import supabase from '@/config/supabaseConnect';
import { QrCode, Search, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

function HomeContent() {
  const searchParams = useSearchParams();
  const qrId = searchParams?.get('qrId');

  const [isValidQrId, setIsValidQrId] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    // No QR id in the URL — nothing to validate; the entry-choices screen
    // below handles this case.
    if (!qrId || qrId.trim() === '') return;

    let active = true;

    const validateQr = async () => {
      // Match on the unique qrId value rather than the full URL, so a code
      // resolves the same way on localhost, preview, and production.
      const { data, error } = await supabase
        .from('property_table')
        .select('property_id')
        .ilike('qr_id', `%qrId=${qrId}`)
        .maybeSingle();

      if (!active) return;

      if (error) {
        toast.error("Couldn't validate QR ID");
        setIsValidQrId(false);
      } else if (!data) {
        toast.error('Invalid QR');
        setIsValidQrId(false);
      } else {
        setIsValidQrId(true);
      }
    };

    validateQr();

    return () => {
      active = false;
    };
  }, [qrId]);

  // No QR id present — show the app entry choices.
  if (!qrId || qrId.trim() === '') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-sm bg-secondary text-primary">
            <QrCode className="size-6" strokeWidth={1.75} />
          </span>
          <h1 className="text-xl font-semibold text-foreground">No QR code scanned</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You can still continue into the console.
          </p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            <Link href="/search-property" className="flex items-center justify-center gap-2 rounded-sm bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent">
              <Search className="size-4" strokeWidth={1.75} /> Search
            </Link>
            <Link href="/admin" className="flex items-center justify-center gap-2 rounded-sm bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent">
              <User className="size-4" strokeWidth={1.75} /> Admin
            </Link>
            <Link href="/scanner" className="flex items-center justify-center gap-2 rounded-sm bg-signal px-3 py-2 text-sm font-semibold text-signal-foreground transition-colors hover:bg-signal/90">
              <QrCode className="size-4" strokeWidth={1.75} /> Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isValidQrId === false) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full border-2 border-danger text-danger">
            <AlertTriangle className="size-6" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">QR ID missing or invalid</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No valid QR code was found in the link. Please scan a valid code.
          </p>
          <Link
            href="/scanner"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-sm bg-signal px-5 py-2.5 font-semibold text-signal-foreground transition-colors hover:bg-signal/90"
          >
            <QrCode className="size-4" /> Scan again
          </Link>
        </div>
      </div>
    );
  }

  if (isValidQrId === null) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Validating QR ID…</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <PropertyForm />
      <Toaster position="top-right" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
