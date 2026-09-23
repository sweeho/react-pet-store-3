/**
 * Wraps the routed page tree (design.md D7 client side, C10). While the
 * session check is loading it renders the same fallback markup as the
 * outer <Suspense> in main.tsx, so a session check looks like any other
 * lazy page load. For a protected path with no signed-in user it redirects
 * to /signin?redirect=<path>, which the sign-in page reads (SWHR3-T-0007)
 * to return here after a successful sign-in.
 */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { PROTECTED_PAGE_PATHS } from "@/constants/protected-pages";
import { useSession } from "@/hooks/use-session";

export interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { loading, user } = useSession();

  if (loading) {
    return <p>...</p>;
  }

  const isProtected = PROTECTED_PAGE_PATHS.some((path) => path === location.pathname);

  if (isProtected && !user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/signin?redirect=${encodeURIComponent(redirectTarget)}`} />;
  }

  return <>{children}</>;
}
