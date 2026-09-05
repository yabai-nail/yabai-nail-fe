import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { AppearanceSettings } from "./AppearanceSettings";

const OPTIONS = messages.admin.settings.appearance.options;

function markup() {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}>
      <AppearanceSettings />
    </NextIntlClientProvider>,
  );
}

/** The <label data-slot="radio-content"> for one option, tag included. */
function labelFor(html: string, name: string) {
  const end = html.indexOf(name);
  if (end === -1) throw new Error(`"${name}" is not in the markup`);
  const start = html.lastIndexOf("<label", end);
  return html.slice(start, html.indexOf("</label>", end));
}

describe("AppearanceSettings", () => {
  it("offers light, dark and system, each with its translated name", () => {
    const html = markup();
    for (const value of ["light", "dark", "system"] as const) {
      expect(html).toContain(`value="${value}"`);
      expect(html).toContain(OPTIONS[value]);
    }
  });

  // Same geometry LanguageSettings pins, for the same reason: HeroUI's Radio is a
  // plain <div>, the input lives in Radio.Content's <label>, so padding outside the
  // label leaves the card and the circle dead to clicks.
  it("puts the padding and the indicator inside the clickable label", () => {
    const label = labelFor(markup(), OPTIONS.dark);

    expect(label).toContain('data-slot="radio-content"');
    expect(label).toMatch(/class="[^"]*px-4[^"]*py-3/);
    expect(label).toContain('data-slot="radio-indicator"');
    expect(label).toContain('type="radio"');
  });

  // The server has no localStorage, so it cannot know the stored theme. It must
  // neither guess one (a hydration mismatch) nor accept a click it cannot act on.
  it("renders system checked and the group disabled on the server", () => {
    const html = markup();

    expect(labelFor(html, OPTIONS.system)).toContain('checked=""');
    expect(labelFor(html, OPTIONS.dark)).not.toContain('checked=""');
    expect(labelFor(html, OPTIONS.light)).not.toContain('checked=""');

    const inputs = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
    expect(inputs).toHaveLength(3);
    for (const input of inputs) expect(input).toContain('disabled=""');
  });
});
