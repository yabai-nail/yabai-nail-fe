"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Card } from "@heroui/react";
import { useCallback, useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { notifySuccess } from "@/lib/app-toast";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  adminService,
  useAdminConversations,
  useAdminConversationMessages,
  useAdminPermission,
  type AdminConversation as ServerConversation,
  type AdminBookingConfirmation,
  type AdminAppointmentCancellationNotice,
  type AdminPaymentRecordedNotice,
  type AdminWarrantyNotice,
  type AdminMessage as ServerMessage,
} from "@/service";
import { ConversationList, type InboxFilter } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { type ChatMessage, type Conversation, type MessageCustomer } from "./data";
import {
  appendConversationMessage,
  type ConversationMessages,
} from "./state";
import { sortThreadChronologically } from "./thread";

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function formatTimeLabel(iso: string, format: (value: Date) => string): string {
  try {
    return format(new Date(iso));
  } catch {
    return "";
  }
}

function toFixtureCustomer(server: ServerConversation, unnamed: string): MessageCustomer {
  const name = server.customer.displayName ?? unnamed;
  return {
    id: server.customer.customerId,
    name,
    initials: deriveInitials(name),
    phone: server.customer.phone ?? "",
  };
}

function toFixtureConversation(server: ServerConversation, unnamed: string, formatTime: (value: Date) => string): Conversation {
  const status = server.status.toLowerCase();
  const normalizedStatus =
    status === "unread" || status === "read" || status === "archived" ? status : "read";
  return {
    id: server.id,
    customer: toFixtureCustomer(server, unnamed),
    preview: server.lastMessage?.content ?? "",
    timeLabel: server.lastMessage ? formatTimeLabel(server.lastMessage.createdAt, formatTime) : "",
    unreadCount: server.unreadCount,
    status: normalizedStatus,
    messages: [],
    version: server.version,
  };
}

function isBookingConfirmation(
  booking: AdminBookingConfirmation | null | undefined,
): booking is AdminBookingConfirmation {
  if (!booking || !Array.isArray(booking.optionNames)) return false;
  const stringFields = [
    "appointmentId",
    "appointmentCode",
    "branchId",
    "customerName",
    "customerPhone",
    "serviceName",
    "staffName",
    "startAt",
    "branchTimeZone",
    "note",
  ] as const;
  return (
    stringFields.every((field) => typeof booking[field] === "string") &&
    (booking.branchName === undefined || typeof booking.branchName === "string") &&
    (booking.branchAddress === undefined || typeof booking.branchAddress === "string") &&
    (booking.expectedPaymentMethod === undefined || booking.expectedPaymentMethod === null ||
      booking.expectedPaymentMethod === "CASH" || booking.expectedPaymentMethod === "PAYPAY" || booking.expectedPaymentMethod === "VISA") &&
    booking.optionNames.every((option) => typeof option === "string") &&
    Number.isInteger(booking.durationMinutes) &&
    booking.durationMinutes > 0 &&
    Number.isInteger(booking.totalJpy) &&
    booking.totalJpy >= 0
  );
}

function isWarrantyNotice(warranty: AdminWarrantyNotice | null | undefined): warranty is AdminWarrantyNotice {
  return Boolean(
    warranty &&
    typeof warranty.warrantyId === "string" &&
    typeof warranty.appointmentId === "string" &&
    typeof warranty.branchId === "string" &&
    typeof warranty.serviceId === "string" &&
    typeof warranty.serviceName === "string" &&
    Number.isInteger(warranty.warrantyDays) &&
    warranty.warrantyDays > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(warranty.startsOn) &&
    /^\d{4}-\d{2}-\d{2}$/.test(warranty.endsOn),
  );
}

function isAppointmentCancellation(
  cancellation: AdminAppointmentCancellationNotice | null | undefined,
): cancellation is AdminAppointmentCancellationNotice {
  if (!cancellation || !Array.isArray(cancellation.optionNames)) return false;
  const stringFields = [
    "appointmentId",
    "appointmentCode",
    "branchId",
    "branchName",
    "branchAddress",
    "serviceName",
    "startAt",
    "branchTimeZone",
    "cancelledAt",
    "reasonCode",
  ] as const;
  return stringFields.every((field) => typeof cancellation[field] === "string") &&
    cancellation.optionNames.every((option) => typeof option === "string") &&
    (cancellation.cancelledBy === "CUSTOMER" || cancellation.cancelledBy === "SALON");
}

function isPaymentRecorded(
  payment: AdminPaymentRecordedNotice | null | undefined,
): payment is AdminPaymentRecordedNotice {
  return Boolean(
    payment &&
    typeof payment.appointmentId === "string" &&
    typeof payment.paymentId === "string" &&
    typeof payment.branchId === "string" &&
    Number.isSafeInteger(payment.amountJpy) &&
    payment.amountJpy >= 0 &&
    (payment.method === "CASH" ||
      payment.method === "PAYPAY" ||
      payment.method === "VISA" ||
      payment.method === "NO_CHARGE") &&
    typeof payment.recordedAt === "string",
  );
}

export function toChatMessage(
  server: ServerMessage,
  formatTime: (value: Date) => string,
): ChatMessage {
  if (
    server.messageType === "BOOKING_CONFIRMATION" &&
    isBookingConfirmation(server.booking)
  ) {
    return {
      id: server.id,
      kind: "booking-confirmation",
      sender: "system",
      booking: server.booking,
      time: formatTimeLabel(server.createdAt, formatTime),
      sentAt: server.createdAt,
    };
  }
  if (server.messageType === "WARRANTY_NOTICE" && isWarrantyNotice(server.warranty)) {
    return {
      id: server.id,
      kind: "warranty-notice",
      sender: "system",
      warranty: server.warranty,
      time: formatTimeLabel(server.createdAt, formatTime),
      sentAt: server.createdAt,
    };
  }
  if (server.messageType === "APPOINTMENT_CANCELLED" && isAppointmentCancellation(server.cancellation)) {
    return {
      id: server.id,
      kind: "appointment-cancelled",
      sender: "system",
      cancellation: server.cancellation,
      time: formatTimeLabel(server.createdAt, formatTime),
      sentAt: server.createdAt,
    };
  }
  if (server.messageType === "PAYMENT_RECORDED" && isPaymentRecorded(server.payment)) {
    return {
      id: server.id,
      kind: "payment-recorded",
      sender: "system",
      payment: server.payment,
      time: formatTimeLabel(server.createdAt, formatTime),
      sentAt: server.createdAt,
    };
  }
  const sender = server.senderType.toLowerCase().includes("customer") ? "customer" : "salon";
  return {
    id: server.id,
    kind: "text",
    sender,
    content: server.content,
    time: formatTimeLabel(server.createdAt, formatTime),
    sentAt: server.createdAt,
  };
}

export function AdminMessagesComponent() {
  const t = useTranslations("admin.messages");
  const tc = useTranslations("admin.common");
  const format = useFormatter();
  const locale = useLocale();
  const formatTime = useCallback(
    (value: Date) => format.dateTime(value, { hour: "2-digit", minute: "2-digit", hour12: false }),
    [format],
  );
  const canWrite = useAdminPermission("message.write.branch");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<ConversationMessages>({});

  const { data: conversationsData, error: conversationsError, mutate: mutateConversations } = useAdminConversations({
    q: query.trim() || undefined,
    status: filter === "all" ? undefined : filter.toUpperCase(),
  });
  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const source = useMemo<ReadonlyArray<Conversation>>(() => {
    return conversationsData?.items?.map((server) => toFixtureConversation(server, t("unnamedCustomer"), formatTime)) ?? [];
  }, [conversationsData, formatTime, t]);

  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return source.filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!normalized || `${item.customer.name} ${item.preview}`.toLocaleLowerCase(locale).includes(normalized)),
    );
  }, [source, filter, locale, query]);
  const selected = resolveVisibleSelection(visibleConversations, selectedId || visibleConversations[0]?.id || "");

  const shouldFetchThread = Boolean(selected);
  const { data: threadData, error: threadError, mutate: mutateThread } = useAdminConversationMessages(
    shouldFetchThread ? selected?.id ?? null : null,
  );

  const messages = useMemo(() => {
    if (!selected) return [];
    const serverThread = threadData?.items ? threadData.items.map((message) => toChatMessage(message, formatTime)) : selected.messages;
    return sortThreadChronologically([...serverThread, ...(localMessages[selected.id] ?? [])]);
  }, [formatTime, selected, threadData, localMessages]);

  const sendMessage = () => {
    const content = draft.trim();
    if (!selected) return;
    if (!content) return;
    if (sendPending) return;
    setDraft("");
    setSendError(null);
    setSendPending(true);
    const localId = `local-${crypto.randomUUID()}`;

    // Optimistic: drop the salon-side bubble into the thread immediately so the
    // composer feels responsive; if the request errors, the draft is restored
    // so the salon can retry — the message they typed is never silently lost.
    setLocalMessages((messagesByConversation) =>
      appendConversationMessage(messagesByConversation, selected.id, {
        id: localId,
        kind: "text",
        sender: "salon",
        content,
        time: t("now"),
        sentAt: new Date().toISOString(),
      }),
    );

    void (async () => {
      try {
        await adminService.sendConversationMessage(selected.id, { content });
        // Server accepted; drop the local bubble and let the refetch bring
        // the canonical message (with real id + timestamp + delivery status).
        setLocalMessages((current) => {
          if (!(selected.id in current)) return current;
          const next = { ...current };
          delete next[selected.id];
          return next;
        });
        await Promise.all([mutateThread(), mutateConversations()]);
      } catch (thrown) {
        setLocalMessages((current) => ({ ...current, [selected.id]: (current[selected.id] ?? []).filter(message => message.id !== localId) }));
        setDraft((current) => current || content);
        setSendError(thrown instanceof Error ? thrown.message : t("sendFailed"));
      } finally {
        setSendPending(false);
      }
    })();
  };

  async function changeStatus(next: "READ" | "UNREAD" | "ARCHIVED") {
    if (!selected || selected.version === undefined) return;
    setStatusPending(true);
    setStatusError(null);
    try {
      await adminService.updateConversation(
        selected.id,
        { status: next },
        selected.version,
      );
      notifySuccess(next === "ARCHIVED" ? tc("conversationArchived") : tc("conversationUpdated"));
      void mutateConversations();
    } catch (thrown) {
      setStatusError(
        thrown instanceof Error ? thrown.message : t("statusFailed"),
      );
    } finally {
      setStatusPending(false);
    }
  }

  return (
    <AdminPageLayout>
      {conversationsError ? (
        <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}
      {/*
        Two columns. The third was 19rem of customer summary that repeated the
        name already in the thread header, printed an empty phone row, and held
        two buttons — which now sit in that header. The conversation takes the
        width back.
      */}
      {/*
        The pane is as tall as the space it sits in, so the composer stays on
        the bottom edge and the thread scrolls inside itself. It used to be
        min-h-[38rem]: a fixed 608px that left 142px of dead space on a tall
        screen and, on a 650px one, put the message box 232px below the fold —
        you scrolled the whole page to reach the thing you type into.

        dvh, not vh: on a phone the address bar shrinking must not shove the
        composer off-screen. min-h keeps it usable if the viewport is tiny, and
        the page scrolls then, as it should.
      */}
      <Card className="grid h-[calc(100dvh-var(--admin-pane-offset))] min-h-[26rem] gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none lg:grid-cols-[19rem_minmax(0,1fr)]">
        <ConversationList
          conversations={visibleConversations}
          selectedId={selected?.id ?? null}
          filter={filter}
          query={query}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onSelect={(id) => { setSelectedId(id); setSendError(null); setStatusError(null); }}
        />
        {selected ? (
          <MessageThread
            customer={selected.customer}
            messages={messages}
            draft={draft}
            onDraftChange={setDraft}
            onSend={sendMessage}
            canWrite={canWrite}
            statusPending={statusPending}
            statusError={threadError ? t("threadLoadFailed") : statusError}
            sendPending={sendPending}
            sendError={sendError}
            onMarkRead={
              canWrite && selected.version !== undefined
                ? () => void changeStatus("READ")
                : undefined
            }
            onArchive={
              canWrite && selected.version !== undefined
                ? () => void changeStatus("ARCHIVED")
                : undefined
            }
          />
        ) : (
          <AdminEmptySelection title={t("emptyTitle")} description={t("emptyDescription")} />
        )}
      </Card>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-messages" } as const;
