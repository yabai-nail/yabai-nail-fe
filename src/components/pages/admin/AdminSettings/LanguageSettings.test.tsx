import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));

import messages from "../../../../../messages/vi.json";
import { LanguageSettings } from "./LanguageSettings";

/**
 * The switcher looked broken for a whole afternoon because of where the padding sat.
 * HeroUI's Radio renders a plain <div>; the radio input lives inside Radio.Content,
 * which is a <label>. Padding on the div is therefore outside the label, so the card
 * and the circle beside the name swallowed every click and only the two words of the
 * language name did anything. These tests pin the geometry, not the wording.
 */
function markup() {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}>
      <LanguageSettings />
    </NextIntlClientProvider>,
  );
}

/** The <label data-slot="radio-content"> for one language, tag included. */
function labelFor(html: string, name: string) {
  const end = html.indexOf(name);
  const start = html.lastIndexOf("<label", end);
  return html.slice(start, html.indexOf("</label>", end));
}

describe("LanguageSettings", () => {
  it("puts the padding and the indicator inside the clickable label", () => {
    const label = labelFor(markup(), "日本語");

    expect(label).toContain('data-slot="radio-content"');
    // The whole card is the click target: its padding belongs to the label.
    expect(label).toMatch(/class="[^"]*px-4[^"]*py-3/);
    expect(label).toContain('data-slot="radio-indicator"');
    expect(label).toContain('type="radio"');
  });

  it("offers every shipped locale, each named in its own language", () => {
    const html = markup();
    for (const [value, name] of [["vi", "Tiếng Việt"], ["ja", "日本語"], ["en", "English"]]) {
      expect(html).toContain(`value="${value}"`);
      expect(html).toContain(name);
    }
  });

  it("marks the active locale as the checked radio", () => {
    expect(labelFor(markup(), "Tiếng Việt")).toContain('checked=""');
  });
});
