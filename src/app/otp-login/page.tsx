"use client";

import Link from "next/link";
import { MdOutlinePhoneIphone } from "react-icons/md";
import { FaGoogle } from "react-icons/fa";

export default function OTPLoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-sm bg-secondary text-primary">
          <MdOutlinePhoneIphone size={24} />
        </span>
        <h1 className="text-xl font-semibold text-foreground">OTP sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phone / OTP sign-in isn&apos;t available yet. Please sign in with your
          authorised Google account for now.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-signal px-5 py-2.5 font-semibold text-signal-foreground transition-colors hover:bg-signal/90"
        >
          <FaGoogle />
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
