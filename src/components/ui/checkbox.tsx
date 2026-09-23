import * as React from "react";

import { cn } from "@/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    const helperId = `${checkboxId}-helper`;

    return (
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          aria-describedby={helperText ? helperId : undefined}
          className={cn(
            "border-input bg-background text-primary focus-visible:ring-ring mt-0.5 h-4 w-4 shrink-0 rounded border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {(label || helperText) && (
          <div className="grid gap-0.5 leading-snug">
            {label && (
              <label htmlFor={checkboxId} className="text-sm">
                {label}
              </label>
            )}
            {helperText && (
              <p id={helperId} className="text-muted-foreground text-xs">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
