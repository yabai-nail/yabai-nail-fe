/**
 * The credential rules the backend enforces when an internal account is created, mirrored so
 * a form can disable its own submit instead of teaching the admin the rule through a 422.
 *
 * They live here rather than inside one modal because two screens issue accounts now: the
 * accounts console, and the staff form that hands a new technician a login alongside their
 * roster record. A copy in each is how the two drift apart.
 */

/**
 * `0` followed by nine digits, which is what the accounts console has always accepted. The
 * backend also takes the `+84` form; this stays with the stricter of the two so a number
 * typed one way on one screen is not rejected on the other.
 */
export function isAdminPhone(value: string): boolean {
  return /^0\d{9}$/.test(value.trim());
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
