import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        navy: "border-transparent bg-primary text-primary-foreground",
        signal: "border-transparent bg-signal/15 text-[color:var(--warning)]",
        success: "border-transparent bg-success/12 text-[color:var(--success)]",
        warning: "border-transparent bg-warning/15 text-[color:var(--warning)]",
        danger: "border-transparent bg-danger/12 text-[color:var(--danger)]",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * Maps a free-text custody status to a colored badge. Unknown statuses fall
 * back to the neutral steel style.
 */
function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const value = (status || "").toLowerCase();
  let variant: VariantProps<typeof badgeVariants>["variant"] = "default";

  if (/dismantl|elimin|dispos|destroy/.test(value)) variant = "danger";
  else if (/court|submit|transfer|releas/.test(value)) variant = "warning";
  else if (/custody|seiz|stored|deposit|receiv|held/.test(value)) variant = "success";
  else if (value) variant = "navy";

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      <span className="inline-block size-1.5 rounded-full bg-current" />
      {status || "—"}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
