import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import messages from "../../../../../messages/vi.json";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";
import { initialAppointments } from "./data";

it("renders authorized private attachment URL, type and escaped note", () => {
  const url = "https://api.example/api/v1/media/photo/content?token=signed";
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}>
    <AppointmentDetailPanel appointment={initialAppointments[0]} photos={[{ mediaId: "photo", kind: "AFTER", note: "Proof <script>alert(1)</script>", url }]} />
  </NextIntlClientProvider>);
  expect(html).toContain(`src="${url}"`); expect(html).toContain(`href="${url}"`);
  expect(html).toContain("Proof &lt;script&gt;"); expect(html).not.toContain("<script>alert");
});
it("does not render an attachment without API photo data", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AppointmentDetailPanel appointment={initialAppointments[0]} /></NextIntlClientProvider>);
  expect(html).not.toContain("<figure");
});
