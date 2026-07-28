// app/loading.tsx
"use client";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background">
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Outer Ring */}
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-[color:var(--border)] border-t-[color:var(--signal)]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />

        {/* Inner Pulse Circle */}
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-[color:var(--primary)]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  );
}
