/**
 * Reads a single cookie from document.cookie (design.md D6). Used by
 * src/pages/signin.tsx to prefill j_username from bp_signon — that cookie
 * is not httpOnly, so it's the only auth cookie the client can read at all.
 */
export function readCookie(name: string): string | undefined {
  const match = document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`));

  if (!match) {
    return undefined;
  }

  return decodeURIComponent(match.slice(name.length + 1));
}
