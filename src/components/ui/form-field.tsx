import * as React from "react";

import { cn } from "@/utils";

import { Label } from "./label";

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export interface FormFieldProps {
  label: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  id?: string;
  className?: string;
  children: React.ReactElement<ControlProps>;
}

const FormField = ({ label, helperText, error, id, className, children }: FormFieldProps) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const describedBy = [helperText && !error ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const control = React.cloneElement(children, {
    id: fieldId,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy || undefined,
  });

  return (
    <div className={cn("mb-4", className)}>
      <Label htmlFor={fieldId} className="mb-1.5 block">
        {label}
      </Label>
      {control}
      {helperText && !error && (
        <p id={helperId} className="text-muted-foreground mt-1.5 text-xs">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-destructive mt-1.5 text-xs">
          {error}
        </p>
      )}
    </div>
  );
};
FormField.displayName = "FormField";

export { FormField };
