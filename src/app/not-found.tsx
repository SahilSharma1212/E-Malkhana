'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex h-[70vh] w-full flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md rounded-md border border-border bg-card px-10 py-8 text-center shadow-sm"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="mono-id text-6xl font-extrabold text-primary">404</p>
        <p className="mt-3 mb-6 text-lg font-medium text-muted-foreground">
          This record or page could not be found.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-signal px-6 py-2 font-semibold text-signal-foreground transition hover:bg-signal/90"
        >
          <span>Go back home</span>
          <Home strokeWidth={1.75} className="size-4" />
        </Link>

        <div className="flex items-center justify-center gap-3 pt-9">
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="h-2.5 w-2.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: 'easeInOut',
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
