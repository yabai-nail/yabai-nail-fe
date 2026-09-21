import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";
import { PaymentMethodPicker } from "./PaymentMethodPicker";

describe("PaymentMethodPicker", () => {
  it("offers exactly Cash, PayPay and VISA", () => {
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale="vi" messages={messages}>
        <PaymentMethodPicker value={null} isDisabled={false} onChange={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(markup.match(/type="radio"/g)).toHaveLength(3);
    expect(markup).toContain("Tiền mặt");
    expect(markup).toContain("PayPay");
    expect(markup).toContain("VISA");
  });
});
