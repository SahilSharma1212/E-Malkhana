import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Compact metric tile for the console dashboards. The value uses tabular
 * figures so a row of tiles aligns cleanly.
 */
function StatTile({
  label,
  value,
  hint,
  icon,
  accent = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-card px-4 py-3.5 shadow-sm",
        className
      )}
    >
      {/* Left accent rule keys the tile to the console identity. */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          accent ? "bg-signal" : "bg-primary"
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums leading-none text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      </div>
    </div>
  );
}

export { StatTile };
