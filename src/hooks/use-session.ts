/**
 * Fetches GET /api/session (design.md C9) on mount and on every pathname
 * change, so a client-side navigation always reflects the current session
 * state. Used by RequireAuth to decide whether a protected page redirects.
 *
 * `loading` is derived during render by comparing the pathname the last
 * fetch resolved for against the current one, rather than reset with a
 * synchronous setState at the top of the effect — react-hooks flags the
 * latter as a cascading-render anti-pattern; setState only ever runs inside
 * the fetch's own then/catch callback, in response to the external result.
 */
import { useLocation } from "react-router";

import { apiFetch } from "@/utils/api";

export interface SessionUser {
  id: number;
  username: string;
}

interface SessionResponse {
  user: SessionUser | null;
  locale: string;
  expired: boolean;
}

export interface UseSessionResult {
  loading: boolean;
  user: SessionUser | null;
  locale: string | undefined;
  expired: boolean;
}

interface Resolved {
  pathname: string;
  data: Omit<UseSessionResult, "loading">;
}

const INITIAL_DATA: Omit<UseSessionResult, "loading"> = {
  user: null,
  locale: undefined,
  expired: false,
};

export function useSession(): UseSessionResult {
  const { pathname } = useLocation();
  const [resolved, setResolved] = useState<Resolved>({ pathname: "", data: INITIAL_DATA });

  useEffect(() => {
    let cancelled = false;

    apiFetch<SessionResponse>("/api/session")
      .then((response) => {
        if (cancelled) {
          return;
        }
        setResolved({
          pathname,
          data: { user: response.user, locale: response.locale, expired: response.expired },
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setResolved({ pathname, data: INITIAL_DATA });
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (resolved.pathname !== pathname) {
    return { loading: true, ...resolved.data };
  }

  return { loading: false, ...resolved.data };
}
