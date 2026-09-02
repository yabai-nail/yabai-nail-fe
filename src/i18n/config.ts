/**
 * The locales the console ships. `vi` is first because it is what every string in
 * the codebase is written in today; `ja` and `en` are translations of it.
 */
export const LOCALES = ["vi", "ja", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";

/**
 * next-intl's own convention, and the name Next's docs use for the same job. Kept
 * as a constant because the switcher writes it and the server reads it, and a typo
 * on either side fails silently as "always Vietnamese".
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * The cookie is the only locale source a server render has.
 *
 * The admin session lives in localStorage, not a cookie — the backend returns
 * tokens in the JSON body and sets none — so `AdminSession.locale` cannot be read
 * here. The client copies it into the cookie once after sign-in; until it does,
 * this answers the default. See SPEC-admin-i18n §4.
 */
export function pickLocale(cookieValue: string | undefined | null): Locale {
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}

/**
 * What a pure module accepts instead of calling useTranslations().
 *
 * Several modules under components/pages/admin declare `world: "pure"` and are called
 * from render and from useMemo alike; a hook rules out one of those. They take this
 * instead, which is the shape next-intl's own `useTranslations(namespace)` returns.
 */
export type Translator = ((key: string, values?: Record<string, string | number>) => string) & {
  has: (key: string) => boolean;
};
