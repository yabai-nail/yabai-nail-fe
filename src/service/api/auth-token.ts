// Split slots so an admin logging in doesn't overwrite a customer session
// in the same browser tab, and vice versa. The axios interceptor picks the
// right slot from the request URL — admin routes carry the admin bearer,
// everything else carries the customer bearer.

let adminToken: string | null = null;
let customerToken: string | null = null;

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
 * Route-aware bearer picker. Called by the axios interceptor. Any request
 * to `/admin/*` gets the admin bearer; everything else (customer, public,
 * media, /me/*) gets the customer bearer.
 */
export function getAccessTokenForUrl(url: string): string | null {
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
