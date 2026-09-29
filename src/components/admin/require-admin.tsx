/**
 * Gates every admin page except /admin/signin (design.md D9). A signed-out
 * visitor or a signed-in non-admin is sent to
 * /admin/signin?redirect=<path>; that page (src/pages/admin/signin.tsx)
 * tells the two cases apart and returns an admin to the redirect target.
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useSession } from "@/hooks/use-session";

export interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const location = useLocation();
  const { loading, user } = useSession();

  if (loading) {
    return <p>...</p>;
  }

  if (!user || user.role !== "admin") {
    const redirectTarget = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/admin/signin?redirect=${encodeURIComponent(redirectTarget)}`} />;
  }

  return <>{children}</>;
}
