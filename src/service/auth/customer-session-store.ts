// Customer twin of `admin-session-store.ts`, deliberately kept as a separate
// module with its own localStorage key: a customer signing in on a shared
// device must never land in the admin slot, and clearing one session must not
// touch the other. Same rule as the split bearer slots in `api/auth-token.ts`.
//
// Only the refresh token survives a reload. The access token stays in memory
// because `POST /auth/sessions/refresh` mints a fresh one on boot anyway.
//
// ponytail: localStorage, not an httpOnly cookie — the backend returns tokens
// in the JSON body and sets no cookie, so a cookie session needs a backend
// change first.

export const CUSTOMER_SESSION_STORAGE_KEY = "yabai.customer.session";

export interface StoredCustomerSession {
  readonly sessionId: string;
  readonly refreshToken: string;
}

/** Parses whatever is in storage, returning null for anything unusable. */
export function parseStoredCustomerSession(
  raw: string | null,
): StoredCustomerSession | null {
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

export function readCustomerSession(): StoredCustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredCustomerSession(
      window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY),
    );
  } catch {
    // Storage can throw when disabled (Safari private mode, quota). Treat it
    // as "no session" rather than breaking the site.
    return null;
  }
}

export function writeCustomerSession(session: StoredCustomerSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session === null) {
      window.localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        CUSTOMER_SESSION_STORAGE_KEY,
        JSON.stringify(session),
      );
    }
  } catch {
    // Same reason as the read: never let persistence break navigation.
  }
}
