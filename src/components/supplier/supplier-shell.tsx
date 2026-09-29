/**
 * The supplier portal's own shell (design.md D1, mockup-inventory-access-
 * denied.html topbar): "Pet Store Supplier", the signed-in user's name with
 * the "Supplier administrator" label (only for an account that has the role),
 * and Sign out. It is neither the storefront nor the admin shell.
 */
import { PawPrint } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui";
import { SUPPLIER_ROLE_LABEL, SUPPLIER_SIGNIN } from "@/constants/supplier";
import { useSession } from "@/hooks/use-session";
import { signOutSupplier } from "@/utils/supplier-api";

export interface SupplierShellProps {
  children: ReactNode;
}

export function SupplierShell({ children }: SupplierShellProps) {
  const navigate = useNavigate();
  const { user } = useSession();

  const handleSignOut = async () => {
    await signOutSupplier();
    navigate(SUPPLIER_SIGNIN);
  };

  return (
    <div className="bg-sidebar min-h-screen">
      <header className="bg-card border-border border-b">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between px-10">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg">
              <PawPrint className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-base font-bold tracking-tight">Pet Store Supplier</span>
          </div>
          {user && (
            <div className="flex items-center gap-3.5">
              <div className="text-right leading-tight">
                <span className="block text-[13px] font-medium">{user.username}</span>
                {user.role === "supplier" && (
                  <span className="border-border bg-secondary text-muted-foreground mt-0.5 inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-semibold tracking-wide">
                    {SUPPLIER_ROLE_LABEL}
                  </span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-10 py-8">{children}</main>
    </div>
  );
}
