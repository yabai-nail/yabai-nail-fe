import { describe, expect, it } from "vitest";

import type { AdminMessage } from "@/service";

import { toChatMessage } from "./component";

describe("toChatMessage", () => {
  it("maps a persisted booking confirmation to a system card", () => {
    const server = {
      id: "booking-confirmation:appointment-1",
      conversationId: "conversation-1",
      senderType: "SYSTEM",
      messageType: "BOOKING_CONFIRMATION",
      content: "Booking YN-00012345 confirmed",
      createdAt: "2026-09-20T07:30:00.000Z",
      booking: {
        appointmentId: "appointment-1",
        appointmentCode: "YN-00012345",
        branchId: "branch-1",
        customerName: "Le Nhat Huy",
        customerPhone: "0914163312",
        serviceName: "Gel color",
        optionNames: ["Nail trim"],
        staffName: "CHI_LINH_3",
        startAt: "2026-09-20T07:30:00.000Z",
        durationMinutes: 90,
        totalJpy: 22_000,
        branchTimeZone: "Asia/Ho_Chi_Minh",
        note: "",
      },
    } satisfies AdminMessage;

    const message = toChatMessage(server, () => "14:30");

    expect(message.kind).toBe("booking-confirmation");
    expect(message.sender).toBe("system");
    if (message.kind === "booking-confirmation") {
      expect(message.booking.customerName).toBe("Le Nhat Huy");
      expect(message.booking.customerPhone).toBe("0914163312");
    }
  });
});
