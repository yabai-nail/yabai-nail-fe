// Only the refresh token survives a reload. The access token stays in memory
// (auth-token.ts) because it lives an hour and `POST /auth/sessions/refresh`
// mints a fresh one on boot anyway — persisting it would widen the blast
// radius of an XSS for no gain.
//
// ponytail: localStorage, not an httpOnly cookie. The backend hands tokens
// back in the JSON body and sets no cookie, so a cookie-based session needs a
// backend change first. Revisit if that lands.

export const ADMIN_SESSION_STORAGE_KEY = "yabai.admin.session";

export interface StoredAdminSession {
  readonly sessionId: string;
  readonly refreshToken: string;
}

/** Parses whatever is in storage, returning null for anything unusable. */
export function parseStoredAdminSession(raw: string | null): StoredAdminSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { sessionId, refreshToken } = parsed as Record<string, unknown>;
    if (typeof sessionId !== "string" || sessionId === "") return null;
    if (typeof refreshToken !== "string" || refreshToken === "") return null;
    return { sessionId, refreshToken };
  } catch {
    return null;
  }
}

export function readAdminSession(): StoredAdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredAdminSession(window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY));
  } catch {
    // Storage can throw when disabled (Safari private mode, quota). Treat it
    // as "no session" rather than breaking the shell.
    return null;
  }
}

export function writeAdminSession(session: StoredAdminSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session === null) window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    else window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Same reason as the read: never let persistence break navigation.
  }
}
