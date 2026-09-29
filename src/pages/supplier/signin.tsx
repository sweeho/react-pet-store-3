/**
 * /supplier/signin (design.md D1, mockup-supplier-sign-in.html): signs in
 * through POST /api/auth/signin, then re-reads GET /api/session (the POST
 * response carries no role) to tell a supplier from anyone else. A supplier
 * goes to the redirect target (default /supplier); any other account sees the
 * access-denied content.
 */
import { PawPrint } from "lucide-react";
import { Navigate, useSearchParams } from "react-router";

import { AccessDenied } from "@/components/supplier/require-supplier";
import { Alert, AlertDescription, AlertTitle, Button, FormField, Input } from "@/components/ui";
import { SUPPLIER_HOME } from "@/constants/supplier";
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
  return SUPPLIER_HOME;
}

export default function SupplierSignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [denied, setDenied] = useState(false);

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
      if (fresh.user?.role === "supplier") {
        navigate(redirectTarget);
      } else {
        setDenied(true);
      }
    } catch {
      setSignInFailed(true);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  if (denied) {
    return (
      <div className="px-6 py-10">
        <AccessDenied />
      </div>
    );
  }

  if (session.loading) {
    return <p>...</p>;
  }

  if (session.user?.role === "supplier") {
    return <Navigate replace to={redirectTarget} />;
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
          <PawPrint className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <div className="text-lg font-bold tracking-tight">Pet Store Supplier</div>
          <div className="text-muted-foreground text-sm">Sign in to manage inventory.</div>
        </div>
      </div>
      {signInFailed && (
        <Alert variant="destructive" role="alert" className="mb-4">
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
        noValidate
        className="border-border bg-card rounded-lg border p-7 shadow-sm"
      >
        <FormField label="Username">
          <Input
            name="j_username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FormField>
        <FormField label="Password" className="mb-6">
          <Input
            name="j_password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={submitting}>
          Sign in
        </Button>
      </form>
      <p className="text-muted-foreground mt-4 text-center text-xs">
        Supplier accounts are issued by the store administrator.
      </p>
    </div>
  );
}
