import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "../../../../../messages/vi.json";

import { BookingConfirmationCard } from "./BookingConfirmationCard";

describe("BookingConfirmationCard", () => {
  it("shows the customer contact alongside the immutable appointment snapshot", () => {
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}>
        <BookingConfirmationCard
          booking={{
            appointmentId: "appointment-1",
            appointmentCode: "YN-00012345",
            branchId: "branch-1",
            customerName: "Lê Nhật Huy",
            customerPhone: "0914163312",
            serviceName: "Fixture service",
            optionNames: ["Cắt móng"],
            staffName: "CHI_LINH_3",
            startAt: "2026-09-20T07:30:00.000Z",
            durationMinutes: 90,
            totalJpy: 22_000,
            branchTimeZone: "Asia/Ho_Chi_Minh",
            note: "Mẫu màu hồng",
          }}
        />
      </NextIntlClientProvider>,
    );

    for (const value of [
      "Lê Nhật Huy",
      "0914163312",
      "YN-00012345",
      "Fixture service",
      "Cắt móng",
      "CHI_LINH_3",
      "Mẫu màu hồng",
    ]) {
      expect(markup).toContain(value);
    }
  });
});
