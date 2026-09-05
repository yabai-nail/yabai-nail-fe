/** The three answers the console accepts; `system` defers to the operating system. */
export const APPEARANCES = ["light", "dark", "system"] as const;

export type Appearance = (typeof APPEARANCES)[number];

export function isAppearance(value: unknown): value is Appearance {
  return typeof value === "string" && (APPEARANCES as readonly string[]).includes(value);
}

/**
 * What the radio group shows.
 *
 * next-themes keeps the choice in localStorage, so the server renders with `theme`
 * undefined while the client's first render already holds the stored value. React
 * compares those two renders at hydration, and a `checked` that differs between
 * them is a mismatch warning. Until the browser reports itself hydrated both sides
 * therefore answer `system`; after that the stored theme wins, with anything
 * unrecognised treated as `system` rather than handing react-aria an undefined
 * value and letting the group drift into uncontrolled mode.
 */
export function selectedAppearance(theme: string | undefined, isReady: boolean): Appearance {
  if (!isReady) return "system";
  return isAppearance(theme) ? theme : "system";
}
