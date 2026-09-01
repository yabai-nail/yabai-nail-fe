import { cookies } from "next/headers";

import { LOCALE_COOKIE, pickLocale, type Locale } from "./config";

/**
 * Server-side locale for the current request. Thin on purpose: the decision lives
 * in pickLocale(), which is pure and tested, while this only supplies the cookie.
 */
export async function resolveLocale(): Promise<Locale> {
  const store = await cookies();
  return pickLocale(store.get(LOCALE_COOKIE)?.value);
}
