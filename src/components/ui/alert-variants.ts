import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "relative flex gap-3 rounded-lg border p-4 text-sm [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground [&_svg]:text-foreground",
        destructive:
          "border-destructive/35 bg-destructive/5 text-foreground [&_svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
