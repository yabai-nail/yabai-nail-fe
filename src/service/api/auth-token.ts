// Split slots so an admin logging in doesn't overwrite a customer session
// in the same browser tab, and vice versa. The axios interceptor picks the
// right slot from the request URL — admin routes carry the admin bearer,
// everything else carries the customer bearer.

let adminToken: string | null = null;
let customerToken: string | null = null;

export type AuthScope = "admin" | "customer";

export function getAdminAccessToken(): string | null {
  return adminToken;
}

export function setAdminAccessToken(token: string | null): void {
  adminToken = token;
}

export function getCustomerAccessToken(): string | null {
  return customerToken;
}

export function setCustomerAccessToken(token: string | null): void {
  customerToken = token;
}

/**
 * Route-aware bearer picker. Shared routes such as `/media/*` declare their
 * scope explicitly; otherwise `/admin/*` gets the admin bearer and customer,
 * public and `/me/*` routes use the customer bearer.
 */
export function getAccessTokenForUrl(url: string, scope?: AuthScope): string | null {
  if (scope === "admin") return adminToken;
  if (scope === "customer") return customerToken;
  return url.includes("/admin/") ? adminToken : customerToken;
}

// -- Back-compat -----------------------------------------------------------
// The pre-split call site was `setAccessToken(session.accessToken)` inside
// `authService.loginAdmin`. Keep the old names alive so nothing breaks
// while callers migrate to the role-specific setters. Reads return the
// admin slot first because the only historical writer was admin login.

export function getAccessToken(): string | null {
  return adminToken ?? customerToken;
}

export function setAccessToken(token: string | null): void {
  setAdminAccessToken(token);
}
