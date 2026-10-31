/**
 * How a newly adopted session changes the permissions/capabilities already
 * held. A sign-in (or boot restore) may be a different user, so the grants are
 * dropped and re-fetched from `GET /admin/auth/session`. A mid-session token
 * rotation is the same session: keeping the grants matters because
 * AdminAuthGate treats `null` as "still restoring" and would swap the console
 * for a spinner that nothing clears.
 */
export type SessionAdoption = "signed-in" | "rotated";

export function grantsAfter<T>(adoption: SessionAdoption, current: T | null): T | null {
  return adoption === "rotated" ? current : null;
}
