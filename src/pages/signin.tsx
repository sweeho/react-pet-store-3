/**
 * /signin (design.md D14, C11, D6): the Returning customer panel signs a
 * customer in and optionally remembers their user name via bp_signon; the
 * New customer panel is SWHR3-T-0008's to build. Body layout follows
 * mockup-sign-on.html — the storefront shell (top bar, category nav,
 * footer) belongs to swhr3-i-0009 and isn't built here (design MANIFEST).
 */
import { useSearchParams } from "react-router";

import { Button, Checkbox, FormField, Input } from "@/components/ui";
import { PROFILE_PATH, REMEMBER_COOKIE_NAME } from "@/constants/auth";
import { ApiError, apiFetch } from "@/utils/api";
import { readCookie } from "@/utils/cookies";

interface SignInResponse {
  user: { id: number; username: string };
}

function resolveRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return PROFILE_PATH;
}

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(() => readCookie(REMEMBER_COOKIE_NAME) ?? "");
  const [password, setPassword] = useState("");
  const [rememberUsername, setRememberUsername] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setError(undefined);
    setSubmitting(true);

    try {
      await apiFetch<SignInResponse>("/api/auth/signin", {
        method: "POST",
        body: {
          j_username: username,
          j_password: password,
          j_remember_username: rememberUsername,
        },
      });
      navigate(resolveRedirect(searchParams.get("redirect")));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to your account</h1>
      <p className="text-muted-foreground mt-2 mb-6 text-sm">
        Sign in to continue to checkout, or create an account — it takes about a minute.
      </p>
      <div className="flex items-start gap-6">
        <section className="bg-card flex-1 rounded-lg border shadow-sm">
          <div className="px-6 pt-5">
            <h2 className="text-base font-semibold">Returning customer</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Sign in to check out with your saved address and card.
            </p>
          </div>
          <div className="px-6 pt-5 pb-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSignIn();
              }}
              noValidate
            >
              {error && (
                <p role="alert" className="text-destructive mb-4 text-sm">
                  {error}
                </p>
              )}
              <FormField label="User name">
                <Input
                  name="j_username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </FormField>
              <FormField label="Password">
                <Input
                  name="j_password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </FormField>
              <div className="mb-5">
                <Checkbox
                  name="j_remember_username"
                  checked={rememberUsername}
                  onChange={(event) => setRememberUsername(event.target.checked)}
                  label="Remember my user name"
                  helperText="Fills this field in for you next time on this browser."
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                Sign in
              </Button>
              <p className="text-muted-foreground mt-3 text-center text-xs">
                We&rsquo;ll take you back to the page you were on.
              </p>
            </form>
          </div>
        </section>
        <section className="bg-card flex-1 rounded-lg border shadow-sm" aria-label="New customer">
          <div className="px-6 pt-5">
            <h2 className="text-base font-semibold">New customer</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Pick a user name and password. We&rsquo;ll ask for your contact and card details next.
            </p>
          </div>
          {/* Registration form — SWHR3-T-0008 */}
          <div className="px-6 pt-5 pb-6">
            <p className="text-muted-foreground text-sm">Coming soon.</p>
          </div>
        </section>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        Sessions end after 30 minutes without activity. Your language stays set to English for this
        visit.
      </p>
    </div>
  );
}
