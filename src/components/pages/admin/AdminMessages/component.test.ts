import { describe, expect, it } from "vitest";

import type { AdminMessage } from "@/service";

import { shouldAutoMarkConversationRead, toChatMessage } from "./component";

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
        branchName: "Tenjin",
        branchAddress: "1-2-3 Tenjin, Fukuoka",
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
        expectedPaymentMethod: "PAYPAY",
      },
    } satisfies AdminMessage;

    const message = toChatMessage(server, () => "14:30");

    expect(message.kind).toBe("booking-confirmation");
    expect(message.sender).toBe("system");
    if (message.kind === "booking-confirmation") {
      expect(message.booking.customerName).toBe("Le Nhat Huy");
      expect(message.booking.customerPhone).toBe("0914163312");
      expect(message.booking.branchAddress).toBe("1-2-3 Tenjin, Fukuoka");
      expect(message.booking.expectedPaymentMethod).toBe("PAYPAY");
    }
  });

  it("maps cancellation and recorded-payment messages to system cards", () => {
    const base = {
      conversationId: "conversation-1",
      senderType: "SYSTEM",
      content: "System update",
      createdAt: "2026-09-20T08:00:00.000Z",
    };
    const cancelled = toChatMessage({
      ...base,
      id: "cancelled:appointment-1",
      messageType: "APPOINTMENT_CANCELLED",
      cancellation: {
        appointmentId: "appointment-1",
        appointmentCode: "YN-00012345",
        branchId: "branch-1",
        branchName: "Tenjin",
        branchAddress: "1-2-3 Tenjin, Fukuoka",
        serviceName: "Gel color",
        optionNames: ["Nail trim"],
        startAt: "2026-09-21T07:30:00.000Z",
        branchTimeZone: "Asia/Tokyo",
        cancelledBy: "CUSTOMER",
        cancelledAt: "2026-09-20T08:00:00.000Z",
        reasonCode: "CUSTOMER_REQUEST",
      },
    } satisfies AdminMessage, () => "17:00");
    const paid = toChatMessage({
      ...base,
      id: "payment:appointment-1",
      messageType: "PAYMENT_RECORDED",
      payment: {
        appointmentId: "appointment-1",
        paymentId: "payment-1",
        branchId: "branch-1",
        amountJpy: 0,
        method: "NO_CHARGE",
        recordedAt: "2026-09-20T08:00:00.000Z",
      },
    } satisfies AdminMessage, () => "17:00");

    expect(cancelled).toMatchObject({ kind: "appointment-cancelled", sender: "system" });
    expect(paid).toMatchObject({
      kind: "payment-recorded",
      sender: "system",
      payment: { amountJpy: 0, method: "NO_CHARGE" },
    });
  });

  it("maps a persisted warranty notice to a system card", () => {
    const server = {
      id: "warranty-notice:appointment-1",
      conversationId: "conversation-1",
      senderType: "SYSTEM",
      messageType: "WARRANTY_NOTICE",
      content: "Warranty issued",
      createdAt: "2026-09-20T08:00:00.000Z",
      warranty: {
        warrantyId: "warranty-1",
        appointmentId: "appointment-1",
        branchId: "branch-1",
        serviceId: "service-1",
        serviceName: "Gel color",
        warrantyDays: 30,
        startsOn: "2026-09-20",
        endsOn: "2026-10-20",
        locale: "vi",
      },
    } satisfies AdminMessage;

    const message = toChatMessage(server, () => "15:00");

    expect(message.kind).toBe("warranty-notice");
    if (message.kind === "warranty-notice") {
      expect(message.warranty.endsOn).toBe("2026-10-20");
    }
  });
});

describe("shouldAutoMarkConversationRead", () => {
  it("marks read when a writable staff opens an unread conversation", () => {
    expect(shouldAutoMarkConversationRead({ unreadCount: 1, version: 3 }, true)).toBe(true);
  });

  it("stays quiet on an already-read conversation", () => {
    expect(shouldAutoMarkConversationRead({ unreadCount: 0, version: 3 }, true)).toBe(false);
  });

  it("does not mark read without write permission", () => {
    expect(shouldAutoMarkConversationRead({ unreadCount: 2, version: 3 }, false)).toBe(false);
  });

  it("waits for a version before issuing the If-Match write", () => {
    expect(shouldAutoMarkConversationRead({ unreadCount: 2, version: undefined }, true)).toBe(false);
  });

  it("handles a missing selection", () => {
    expect(shouldAutoMarkConversationRead(null, true)).toBe(false);
  });
});
