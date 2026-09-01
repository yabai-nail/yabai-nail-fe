import type { Locale } from "./config";

export type Messages = Record<string, unknown>;

/**
 * One catalogue per locale, imported dynamically so a build only ships the JSON a
 * request actually needs. The map is explicit rather than a template path because
 * a computed import cannot be statically analysed, and an unresolvable locale
 * would then fail at request time instead of at build time.
 */
const catalogues: Record<Locale, () => Promise<Messages>> = {
  vi: () => import("../../messages/vi.json").then((module) => module.default),
  ja: () => import("../../messages/ja.json").then((module) => module.default),
  en: () => import("../../messages/en.json").then((module) => module.default),
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return catalogues[locale]();
}
