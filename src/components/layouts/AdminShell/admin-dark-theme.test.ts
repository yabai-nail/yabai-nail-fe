import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The console paints itself from `--admin-*` tokens declared in globals.css, on
 * both `.admin-shell` and `body:has(.admin-shell)` because HeroUI portals modals
 * and popovers out of the shell. next-themes only puts `.dark` on <html>; nothing
 * about that reaches the admin tokens unless a rule says so. These read the
 * stylesheet itself so a token added to the light block without a dark twin fails
 * here instead of rendering as a light patch on a dark screen.
 */
const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** Flat `selector -> body` for every rule that is not nested in another block. */
function rules(): Map<string, string> {
  const out = new Map<string, string>();
  for (const match of css.matchAll(/([^{}]*?)\s*\{([^{}]*)\}/g)) {
    const selector = match[1].replace(/^\s*\}\s*/, "").replace(/\s+/g, " ").trim();
    if (selector) out.set(selector, match[2]);
  }
  return out;
}

const properties = (body: string) => new Map([...body.matchAll(/(--[a-z-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

const LIGHT = ".admin-shell, body:has(.admin-shell)";
const DARK = '.dark .admin-shell, .dark body:has(.admin-shell), [data-theme="dark"] .admin-shell, [data-theme="dark"] body:has(.admin-shell)';

describe("admin console dark theme", () => {
  const all = rules();
  const light = all.get(LIGHT);
  const dark = all.get(DARK);

  it("declares a dark rule on every selector the light rule uses", () => {
    expect(light, `light rule "${LIGHT}"`).toBeDefined();
    expect(dark, `dark rule "${DARK}"`).toBeDefined();
  });

  it("switches the colour scheme so native controls follow", () => {
    expect(properties(dark ?? "")).toBeDefined();
    expect(dark).toMatch(/color-scheme\s*:\s*dark\s*;/);
  });

  it("redefines every token the light rule defines", () => {
    const lightTokens = [...properties(light ?? "").keys()];
    const darkTokens = properties(dark ?? "");
    expect(lightTokens.length).toBeGreaterThan(0);
    for (const token of lightTokens) expect(darkTokens.has(token), token).toBe(true);
  });

  it("actually darkens the surfaces rather than restating the light values", () => {
    const lightTokens = properties(light ?? "");
    const darkTokens = properties(dark ?? "");
    for (const token of ["--admin-canvas", "--admin-surface", "--admin-ink", "--admin-border", "--admin-soft"]) {
      expect(darkTokens.get(token), token).not.toBe(lightTokens.get(token));
    }
  });
});
