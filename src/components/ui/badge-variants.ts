import { cva } from "class-variance-authority";

export type BadgeVariant = "pending" | "approved" | "denied" | "completed" | "staged";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      variant: {
        pending: "border-border bg-secondary text-muted-foreground",
        approved: "border-teal-200 bg-teal-50 text-teal-700",
        denied: "border-destructive/30 bg-destructive/10 text-destructive",
        completed: "border-blue-200 bg-blue-50 text-blue-700",
        staged: "border-foreground/70 bg-secondary text-foreground border-dashed",
      } satisfies Record<BadgeVariant, string>,
    },
  },
);
