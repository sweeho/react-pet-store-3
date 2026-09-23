import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/utils";

import { inputVariants } from "./input-variants";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type = "text", ...props }, ref) => (
    <input type={type} className={cn(inputVariants({ variant, className }))} ref={ref} {...props} />
  ),
);
Input.displayName = "Input";

export { Input };
