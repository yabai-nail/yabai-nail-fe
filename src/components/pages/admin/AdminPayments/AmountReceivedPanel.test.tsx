import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { AmountReceivedPanel } from "./AmountReceivedPanel";

function render(value: string, amountDue = 22_000) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <AmountReceivedPanel amountDue={amountDue} disabled={false} value={value} onChange={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("AmountReceivedPanel", () => {
  it("shows the verified PayPay/VISA amount", () => {
    const markup = render("22000");
    expect(markup).toContain("Số tiền đã nhận (¥)");
    expect(markup).toContain("Đã đối chiếu đúng số phải thu");
  });

  it("shows a mismatch before confirmation", () => {
    expect(render("21000")).toContain("Số tiền đã nhận phải khớp số cần thu");
  });
});
