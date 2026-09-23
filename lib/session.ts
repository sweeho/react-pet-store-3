/**
 * The one session module every ticket uses (design.md D2, D7, interface
 * contract C8). Wraps h3's sealed-cookie session (nitro/h3 re-exports h3)
 * with a sliding 30-minute idle timeout: h3's own `maxAge` is absolute from
 * seal time, so the idle window is implemented here by re-sealing with a
 * fresh `lastSeen` on every active read (SD18) instead of setting `maxAge`.
 *
 * `readSession` reads the raw cookie with `getChunkedCookie` before
 * touching any of h3's higher-level session helpers, because `getSession`/
 * `useSession` unconditionally create and seal a brand-new empty session
 * (and set its cookie) the moment they see no valid one — which would make
 * a first-ever visit indistinguishable from a since-expired one on the next
 * read. Reading the raw cookie first keeps "no cookie" (`none`) and
 * "cookie present but stale/unreadable" (`expired`) reliably separate.
 */
import {
  type H3Event,
  type SessionConfig,
  clearSession,
  createError,
  getChunkedCookie,
  unsealSession,
  updateSession,
} from "nitro/h3";

import { AUTH_CONFIG, getSessionSecret } from "./auth-config";

export type SessionUser = { id: number; username: string };

interface SessionPayload {
  accountId: number;
  username: string;
  locale: string;
  lastSeen: number;
}

export type SessionReadResult =
  | { status: "active"; user: SessionUser; locale: string }
  | { status: "expired" }
  | { status: "none" };

function sessionConfig(): SessionConfig {
  return {
    password: getSessionSecret(),
    name: AUTH_CONFIG.sessionCookieName,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export async function startSession(event: H3Event, user: SessionUser): Promise<void> {
  const payload: SessionPayload = {
    accountId: user.id,
    username: user.username,
    locale: AUTH_CONFIG.defaultLocale,
    lastSeen: Date.now(),
  };
  await updateSession(event, sessionConfig(), payload);
}

export async function readSession(event: H3Event): Promise<SessionReadResult> {
  const config = sessionConfig();
  const sealed = getChunkedCookie(event, AUTH_CONFIG.sessionCookieName);

  if (!sealed) {
    return { status: "none" };
  }

  let data: Partial<SessionPayload> | undefined;
  try {
    const unsealed = await unsealSession(event, config, sealed);
    // unsealSession isn't generic over our payload shape; every field is
    // validated below before any of them are used.
    data = unsealed.data as Partial<SessionPayload> | undefined;
  } catch {
    data = undefined;
  }

  if (!data?.accountId || !data.username || !data.lastSeen) {
    await clearSession(event, config);
    return { status: "expired" };
  }

  const idleSeconds = (Date.now() - data.lastSeen) / 1000;
  if (idleSeconds > AUTH_CONFIG.sessionTimeoutSeconds) {
    await clearSession(event, config);
    return { status: "expired" };
  }

  await updateSession(event, config, { lastSeen: Date.now() });

  return {
    status: "active",
    user: { id: data.accountId, username: data.username },
    locale: data.locale ?? AUTH_CONFIG.defaultLocale,
  };
}

export async function endSession(event: H3Event): Promise<void> {
  await clearSession(event, sessionConfig());
}

export async function requireSessionUser(event: H3Event): Promise<SessionUser> {
  const session = await readSession(event);
  if (session.status === "active") {
    return session.user;
  }

  throw createError({
    status: 401,
    message: session.status === "expired" ? "Session timed out" : "Authentication required",
  });
}
