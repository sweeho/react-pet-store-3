/**
 * /signin (design.md D14, C11, C12, D6): the Returning customer panel signs
 * a customer in and optionally remembers their user name via bp_signon; the
 * New customer panel (SWHR3-T-0008) registers a new account and signs it
 * in. Body layout follows mockup-sign-on.html / mockup-registration-error
 * .html — the storefront shell (top bar, category nav, footer) belongs to
 * swhr3-i-0009 and isn't built here (design MANIFEST).
 */
import { useSearchParams } from "react-router";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  FormField,
  Input,
} from "@/components/ui";
import { CREATE_ACCOUNT_PATH, PROFILE_PATH, REMEMBER_COOKIE_NAME } from "@/constants/auth";
import { ApiError, apiFetch } from "@/utils/api";
import { readCookie } from "@/utils/cookies";
import { validatePasswordConfirmation } from "@/utils/form-validation";

interface SignInResponse {
  user: { id: number; username: string };
}

interface RegisterResponse {
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

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regError, setRegError] = useState<string | undefined>(undefined);
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({});
  const [regDuplicate, setRegDuplicate] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);

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

  const handleRegister = async () => {
    setRegError(undefined);
    setRegFieldErrors({});
    setRegDuplicate(false);

    const confirmError = validatePasswordConfirmation(regPassword, regPasswordConfirm);
    if (confirmError) {
      setRegFieldErrors({ j_password_confirm: confirmError });
      return;
    }

    setRegSubmitting(true);
    try {
      await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: {
          j_username: regUsername,
          j_password: regPassword,
          j_password_confirm: regPasswordConfirm,
        },
      });
      navigate(CREATE_ACCOUNT_PATH);
    } catch (err) {
      if (err instanceof ApiError && err.code === "DUPLICATE_ACCOUNT") {
        setRegDuplicate(true);
      } else if (err instanceof ApiError && err.fieldErrors) {
        setRegFieldErrors(err.fieldErrors);
      } else {
        setRegError(
          err instanceof ApiError ? err.message : "Registration failed. Please try again.",
        );
      }
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to your account</h1>
      <p className="text-muted-foreground mt-2 mb-6 text-sm">
        Sign in to continue to checkout, or create an account — it takes about a minute.
      </p>
      <div className="flex items-start gap-6">
        <section
          className="bg-card flex-1 rounded-lg border shadow-sm"
          aria-label="Returning customer"
        >
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
          <div className="px-6 pt-5 pb-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleRegister();
              }}
              noValidate
            >
              {regError && (
                <p role="alert" className="text-destructive mb-4 text-sm">
                  {regError}
                </p>
              )}
              {regDuplicate && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>That user name is already taken</AlertTitle>
                  <AlertDescription>
                    An account already exists with the user name <strong>{regUsername}</strong>.
                    Choose a different one, or sign in on the left if it&rsquo;s yours.
                  </AlertDescription>
                </Alert>
              )}
              <FormField label="User name" error={regFieldErrors.j_username}>
                <Input
                  name="j_username"
                  autoComplete="username"
                  value={regUsername}
                  onChange={(event) => setRegUsername(event.target.value)}
                />
              </FormField>
              <FormField label="Password" error={regFieldErrors.j_password}>
                <Input
                  name="j_password"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(event) => setRegPassword(event.target.value)}
                />
              </FormField>
              <FormField
                label="Confirm password"
                error={regFieldErrors.j_password_confirm}
                className="mb-5"
              >
                <Input
                  name="j_password_confirm"
                  type="password"
                  autoComplete="new-password"
                  value={regPasswordConfirm}
                  onChange={(event) => setRegPasswordConfirm(event.target.value)}
                />
              </FormField>
              <Button type="submit" variant="outline" className="w-full" disabled={regSubmitting}>
                Create new account
              </Button>
              <p className="text-muted-foreground mt-3 text-center text-xs">
                Keep your password safe &mdash; there&rsquo;s no reset link.
              </p>
            </form>
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
