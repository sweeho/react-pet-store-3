/**
 * Wraps every admin page except /admin/signin (design.md D9): header "Pet
 * Store · ADMIN", an Orders nav link, the signed-in user name with an
 * ADMINISTRATOR label, and Sign out. Follows mockup-admin-home.html's
 * topbar; no Reports link (SD14 — admin-dashboard, swhr3-i-0008, isn't
 * built yet).
 */
import type { ReactNode } from "react";
import { Link } from "react-router";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSession } from "@/hooks/use-session";

export interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user } = useSession();

  return (
    <div className="bg-sidebar min-h-screen">
      <header className="bg-card border-border border-b">
        <div className="mx-auto flex h-15 max-w-6xl items-center gap-10 px-10">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold tracking-tight">Pet Store</span>
            <span className="border-border bg-secondary text-muted-foreground inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium tracking-wide">
              ADMIN
            </span>
          </div>
          <nav className="flex flex-1 items-center gap-1">
            <Link
              to="/admin/orders"
              className="bg-secondary text-foreground inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium"
            >
              Orders
            </Link>
          </nav>
          {user && (
            <div className="flex items-center gap-3.5">
              <div className="text-right leading-tight">
                <span className="block text-[13px] font-medium">{user.username}</span>
                <span className="border-border bg-secondary text-muted-foreground mt-0.5 inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-semibold tracking-wide uppercase">
                  Administrator
                </span>
              </div>
              <SignOutButton variant="outline" size="sm" />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-10 py-8">{children}</main>
    </div>
  );
}
