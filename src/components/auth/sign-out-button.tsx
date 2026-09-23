/**
 * Posts to /api/auth/signout and then navigates to /signin (AC-7). Mounted
 * by SWHR3-T-0015 in the account profile page's top bar.
 */
import { Button, type ButtonProps } from "@/components/ui";
import { SIGN_IN_PATH } from "@/constants/auth";
import { apiFetch } from "@/utils/api";

export interface SignOutButtonProps extends Omit<ButtonProps, "onClick" | "type"> {}

export function SignOutButton(props: SignOutButtonProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await apiFetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Sign out locally regardless of the request outcome — the cookie is
      // gone or about to be, either way there is nothing to retry here.
    } finally {
      navigate(SIGN_IN_PATH);
    }
  };

  return (
    <Button type="button" variant="ghost" {...props} onClick={handleSignOut}>
      {props.children ?? "Sign out"}
    </Button>
  );
}
