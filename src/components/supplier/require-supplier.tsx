/**
 * Gates every supplier page except /supplier/signin (design.md D1). A
 * signed-out visitor goes to /supplier/signin?redirect=<path>; a signed-in
 * account without the supplier role sees the access-denied content (mockup-
 * inventory-access-denied.html) inside the supplier shell, never the page.
 */
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { SupplierShell } from "@/components/supplier/supplier-shell";
import { Button } from "@/components/ui";
import { SUPPLIER_SIGNIN } from "@/constants/supplier";
import { useSession } from "@/hooks/use-session";
import { signOutSupplier } from "@/utils/supplier-api";

/** The "Access denied" panel; its button signs out and returns to the supplier sign-in. */
export function AccessDenied() {
  const navigate = useNavigate();

  const handleDifferentUser = async () => {
    await signOutSupplier();
    navigate(SUPPLIER_SIGNIN);
  };

  return (
    <div className="border-border bg-card mx-auto mt-10 max-w-xl rounded-lg border p-10 text-center shadow-sm">
      <span className="bg-muted mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
        <ShieldAlert className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Access denied</h1>
      <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
        Inventory is restricted to accounts with the supplier administrator role. Your account does
        not have it, so this page cannot be shown.
      </p>
      <p className="text-muted-foreground bg-muted mt-5 rounded-lg p-3.5 text-left text-[13px] leading-relaxed">
        Roles are assigned by the store administrator. If you should have access to inventory, ask
        them to add the supplier administrator role to your account.
      </p>
      <div className="mt-6">
        <Button type="button" onClick={handleDifferentUser}>
          Sign in as a different user
        </Button>
      </div>
    </div>
  );
}

export interface RequireSupplierProps {
  children: ReactNode;
}

export function RequireSupplier({ children }: RequireSupplierProps) {
  const location = useLocation();
  const { loading, user } = useSession();

  if (loading) {
    return <p>...</p>;
  }

  if (!user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate replace to={`${SUPPLIER_SIGNIN}?redirect=${encodeURIComponent(redirectTarget)}`} />
    );
  }

  if (user.role !== "supplier") {
    return (
      <SupplierShell>
        <AccessDenied />
      </SupplierShell>
    );
  }

  return <>{children}</>;
}
