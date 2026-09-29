/**
 * A modal built on @headlessui/react Dialog (DESIGN.md §Components).
 * Headless UI's Dialog already traps focus, closes on Escape and returns
 * focus to the control that opened it — this wrapper only supplies the
 * project's styling for the backdrop and panel parts.
 */
import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogDescription as HeadlessDialogDescription,
  DialogPanel as HeadlessDialogPanel,
  DialogTitle as HeadlessDialogTitle,
} from "@headlessui/react";

import { cn } from "@/utils";

export interface DialogProps extends Omit<React.ComponentProps<typeof HeadlessDialog>, "children"> {
  children?: React.ReactNode;
}

function Dialog({ className, children, ...props }: DialogProps) {
  return (
    <HeadlessDialog {...props} className={cn("relative z-50", className)}>
      <DialogBackdrop className="bg-foreground/55 fixed inset-0" />
      <div className="fixed inset-0 flex items-center justify-center p-4">{children}</div>
    </HeadlessDialog>
  );
}

export interface DialogPanelProps extends React.ComponentProps<typeof HeadlessDialogPanel> {}

function DialogPanel({ className, ...props }: DialogPanelProps) {
  return (
    <HeadlessDialogPanel
      className={cn(
        "bg-card border-border w-full max-w-lg rounded-xl border p-6 shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}

export interface DialogTitleProps extends React.ComponentProps<typeof HeadlessDialogTitle> {}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <HeadlessDialogTitle
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export interface DialogDescriptionProps
  extends React.ComponentProps<typeof HeadlessDialogDescription> {}

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <HeadlessDialogDescription
      className={cn("text-muted-foreground mt-1.5 text-sm", className)}
      {...props}
    />
  );
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div className={cn("mt-6 flex justify-end gap-2.5", className)} {...props} />;
}

export { Dialog, DialogPanel, DialogTitle, DialogDescription, DialogFooter };
