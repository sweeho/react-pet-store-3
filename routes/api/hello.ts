/**
 * /api/hello is deliberately not a protected path (design.md AC-9 on
 * SWHR3-T-0011): it greets the signed-in user by name, or "guest" when
 * there is none, and never 401s — e2e/smoke.spec.ts relies on it answering
 * 200 with no session.
 */
import { defineHandler } from "nitro/h3";

export default defineHandler((event) => {
  const username = event.context.user?.username ?? "guest";
  return {
    success: true,
    message: `Hello ${username}`,
  };
});
