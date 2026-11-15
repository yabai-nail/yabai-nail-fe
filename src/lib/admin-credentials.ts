/**
 * The credential rules the backend enforces when an internal account is created, mirrored so
 * a form can disable its own submit instead of teaching the admin the rule through a 422.
 *
 * They live here rather than inside one modal because two screens issue accounts now: the
 * accounts console, and the staff form that hands a new technician a login alongside their
 * roster record. A copy in each is how the two drift apart.
 */

/**
 * Mirrors the backend's `CUSTOMER_PHONE_PATTERN`, which both account creation and the
 * own-profile update check: a local VN (10 digits) or JP (10–11 digits) number starting with
 * `0`, or its `+84`/`+81` form. Anything stricter disables a form for a number the API accepts.
 */
export function isAdminPhone(value: string): boolean {
  return /^(?:0\d{9,10}|\+84\d{9}|\+81\d{9,10})$/.test(value.trim());
}

/** Mirrors `isStrongInternalPassword`: 8–128 characters, with lower case, upper case and a digit. */
export function isStrongTemporaryPassword(value: string): boolean {
  const password = value.trim();
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}
