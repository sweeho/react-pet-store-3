/**
 * /admin/signin (design.md D9, mockup-administrator-sign-in-required.html):
 * signs in through the existing POST /api/auth/signin, then re-checks the
 * session (that response carries no role — GET /api/session reads it
 * fresh, design.md C6) to tell an admin from a non-admin apart. A non-admin
 * sees "This account is not an administrator" and the same form, ready for
 * a different user. The mockup's note about ending a supplier session is
 * omitted (SD15 — no supplier role exists yet).
 */
import { Navigate, useSearchParams } from "react-router";

import { Alert, AlertDescription, AlertTitle, Button, FormField, Input } from "@/components/ui";
import type { SessionUser } from "@/hooks/use-session";
import { useSession } from "@/hooks/use-session";
import { apiFetch } from "@/utils/api";

interface SessionResponse {
  user: SessionUser | null;
}

function resolveRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/admin";
}

export default function AdminSignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [deniedUser, setDeniedUser] = useState<SessionUser | null>(null);

  const redirectTarget = resolveRedirect(searchParams.get("redirect"));

  async function handleSignIn() {
    setSignInFailed(false);
    setSubmitting(true);

    try {
      await apiFetch("/api/auth/signin", {
        method: "POST",
        body: { j_username: username, j_password: password, j_remember_username: false },
      });
      const fresh = await apiFetch<SessionResponse>("/api/session");
      if (fresh.user?.role === "admin") {
        navigate(redirectTarget);
      } else {
        setDeniedUser(fresh.user);
        setUsername("");
        setPassword("");
      }
    } catch {
      setSignInFailed(true);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  if (session.loading && !deniedUser) {
    return <p>...</p>;
  }

  if (!deniedUser && session.user?.role === "admin") {
    return <Navigate replace to={redirectTarget} />;
  }

  const notice =
    deniedUser ?? (session.user && session.user.role !== "admin" ? session.user : null);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="text-base font-bold tracking-tight">Pet Store</span>
        <span className="border-border bg-secondary text-muted-foreground inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium tracking-wide">
          ADMIN
        </span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Administrator sign-in</h1>
      <p className="text-muted-foreground mt-1.5 text-sm">
        Order review is open to administrators only.
      </p>
      {notice && (
        <Alert variant="destructive" role="alert" className="mt-5">
          <AlertTitle>This account is not an administrator</AlertTitle>
          <AlertDescription>
            You are signed in as <strong>{notice.username}</strong>, which does not have
            administrator access.
          </AlertDescription>
        </Alert>
      )}
      {signInFailed && (
        <Alert variant="destructive" role="alert" className="mt-5">
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>
            The user name and password you entered were not found in our records.
          </AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSignIn();
        }}
        className="mt-6"
        noValidate
      >
        <FormField label="User name">
          <Input
            name="j_username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FormField>
        <FormField label="Password" className="mb-5">
          <Input
            name="j_password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={submitting}>
          Sign in as administrator
        </Button>
      </form>
    </div>
  );
}
