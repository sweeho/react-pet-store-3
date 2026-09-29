/**
 * A short uppercase status label with one variant per order state, plus
 * "staged" for a change not yet saved (DESIGN.md §Components). It never
 * carries an action.
 */
import * as React from "react";

import { cn } from "@/utils";

import { badgeVariants } from "./badge-variants";
import type { BadgeVariant } from "./badge-variants";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
  ),
);
Badge.displayName = "Badge";

export { Badge };
