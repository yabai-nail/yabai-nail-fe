import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { CashTenderPanel } from "./CashTenderPanel";

function render(value: string, amountDue = 22_000, disabled = false) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <CashTenderPanel amountDue={amountDue} disabled={disabled} value={value} onChange={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("CashTenderPanel", () => {
  it("shows the cash input and calculates change before payment confirmation", () => {
    const markup = render("25000");

    expect(markup).toContain("Tiền khách đưa (¥)");
    expect(markup).toContain('value="25000"');
    expect(markup).toContain("Tiền thối:");
    expect(markup).toContain("3.000");
  });

  it("shows an inline validation message and respects the disabled state", () => {
    expect(render("")).toContain("Nhập số tiền khách đưa.");
    expect(render("22000", 22_000, true)).toContain("disabled");
  });
});
