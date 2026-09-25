"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Card } from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { notifySuccess } from "@/lib/app-toast";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  adminMediaService,
  adminService,
  ApiClientError,
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
import { addChatAttachments, type ChatAttachment } from "./chat-images";
import { type ChatMessage, type Conversation, type MessageCustomer } from "./data";
import {
  appendConversationMessage,
  type ConversationMessages,
} from "./state";
import { sortThreadChronologically } from "./thread";
import { isPinLimitError } from "./pins";

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

function toFixtureConversation(server: ServerConversation, unnamed: string, formatTime: (value: Date) => string, photoPreview = "", recalledPreview = ""): Conversation {
  const status = server.status.toLowerCase();
  const normalizedStatus =
    status === "unread" || status === "read" || status === "archived" ? status : "read";
  return {
    id: server.id,
    customer: toFixtureCustomer(server, unnamed),
    // A photo-only message has no text to preview.
    preview: server.lastMessage?.recalledAt ? recalledPreview : server.lastMessage?.content || (server.lastMessage?.messageType === "IMAGE" ? photoPreview : ""),
    timeLabel: server.lastMessage ? formatTimeLabel(server.lastMessage.createdAt, formatTime) : "",
    unreadCount: server.unreadCount,
    status: normalizedStatus,
    pinned: typeof server.pinnedAt === "string",
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
    ...(server.images?.length ? { images: server.images } : {}),
    ...(server.recalledAt ? { recalled: true } : {}),
    time: formatTimeLabel(server.createdAt, formatTime),
    sentAt: server.createdAt,
  };
}

/**
 * Whether opening a conversation should silently mark it read for the salon.
 * Opening the thread is the read signal — the customer app already clears its own
 * badge the moment the Tin nhắn tab gains focus, so the salon inbox mirrors that:
 * a staff member reading the thread is enough, no reply or extra click required.
 * Guarded so it never fires without write permission, without a version for the
 * If-Match check, or on a conversation that is already read.
 */
export function shouldAutoMarkConversationRead(
  conversation: { readonly unreadCount: number; readonly version?: number; readonly status?: Conversation["status"] } | null,
  canWrite: boolean,
): boolean {
  return (
    conversation !== null &&
    canWrite &&
    conversation.version !== undefined &&
    conversation.status !== "archived" &&
    conversation.unreadCount > 0
  );
}

export function conversationArchiveAction(status: Conversation["status"]): "READ" | "ARCHIVED" {
  return status === "archived" ? "READ" : "ARCHIVED";
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
  const canPin = useAdminPermission("message.write.branch", "message.read.branch", "message.read.assigned");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ReadonlyArray<ChatAttachment>>([]);
  const [localMessages, setLocalMessages] = useState<ConversationMessages>({});

  const { data: conversationsData, error: conversationsError, mutate: mutateConversations } = useAdminConversations({
    q: query.trim() || undefined,
    status: filter === "all" ? undefined : filter.toUpperCase(),
  });
  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pinPendingId, setPinPendingId] = useState<string | null>(null);
  const source = useMemo<ReadonlyArray<Conversation>>(() => {
    return conversationsData?.items?.map((server) => toFixtureConversation(server, t("unnamedCustomer"), formatTime, t("photoPreview"), t("recalledMessage"))) ?? [];
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

  const attachPhotos = (files: ReadonlyArray<File>) => {
    const result = addChatAttachments(attachments, files, (file) => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) }));
    setAttachments(result.attachments);
    setSendError(result.rejected === "invalid" ? t("photoInvalid") : result.rejected === "limit" ? t("photoLimit") : null);
  };

  const removePhoto = (id: string) => {
    setAttachments((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const sendMessage = () => {
    const content = draft.trim();
    const photos = attachments;
    if (!selected) return;
    if (!content && photos.length === 0) return;
    if (sendPending) return;
    setDraft("");
    setAttachments([]);
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
        ...(photos.length ? { images: photos.map((photo) => ({ mediaId: photo.id, url: photo.previewUrl })) } : {}),
        time: t("now"),
        sentAt: new Date().toISOString(),
      }),
    );

    void (async () => {
      const uploaded: string[] = [];
      try {
        for (const photo of photos) uploaded.push(await adminMediaService.uploadFile(photo.file));
        await adminService.sendConversationMessage(selected.id, { content, ...(uploaded.length ? { imageMediaIds: uploaded } : {}) });
        for (const photo of photos) URL.revokeObjectURL(photo.previewUrl);
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
        // Orphan uploads are cleaned up best-effort; the photos go back into the composer.
        for (const mediaId of uploaded) void adminMediaService.deleteMedia(mediaId).catch(() => undefined);
        setAttachments((current) => current.length ? current : photos);
        setDraft((current) => current || content);
        setSendError(thrown instanceof Error ? thrown.message : t("sendFailed"));
      } finally {
        setSendPending(false);
      }
    })();
  };

  // Opening a conversation marks it read for the salon, so the unread "1" clears
  // on selection the same way the customer app clears its badge on focus. Keyed on
  // primitives (id/unread/version), not the `selected` object, so it fires once per
  // open and not on every render: after the mark-read refetch lands, unreadCount is
  // 0 and the guard short-circuits. Silent by design — no success toast on a plain
  // read — while the explicit mark-read/archive controls below still confirm.
  const openConversationId = selected?.id ?? null;
  const openUnreadCount = selected?.unreadCount ?? 0;
  const openVersion = selected?.version;
  useEffect(() => {
    if (openConversationId === null) return;
    if (!shouldAutoMarkConversationRead({ unreadCount: openUnreadCount, version: openVersion, status: selected?.status }, canWrite)) return;
    void (async () => {
      try {
        await adminService.updateConversation(openConversationId, { status: "READ" }, openVersion);
        await mutateConversations();
      } catch {
        // A failed auto-read is non-fatal: the badge stays and the staff can use the
        // explicit mark-read control. Nothing is surfaced for a background read.
      }
    })();
  }, [openConversationId, openUnreadCount, openVersion, selected?.status, canWrite, mutateConversations]);

  // Recall takes a salon message back for both sides; hide removes any message from this
  // admin's own view. Both refetch the thread and the inbox preview afterwards.
  async function runMessageAction(action: "recall" | "hide", messageId: string) {
    if (!selected) return;
    setStatusError(null);
    try {
      if (action === "recall") await adminService.recallConversationMessage(selected.id, messageId);
      else await adminService.hideConversationMessage(selected.id, messageId);
      notifySuccess(action === "recall" ? t("messageActions.recalled") : t("messageActions.hidden"));
      await Promise.all([mutateThread(), mutateConversations()]);
    } catch (thrown) {
      const code = thrown instanceof ApiClientError ? thrown.code : undefined;
      setStatusError(
        code === "CHAT_MESSAGE_RECALL_EXPIRED" ? t("messageActions.recallExpired")
          : code === "CHAT_MESSAGE_RECALL_FORBIDDEN" ? t("messageActions.recallForbidden")
            : thrown instanceof Error ? thrown.message : t("messageActions.failed"),
      );
    }
  }

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

  // Salon-wide pin. The API client already toasts a failed write, so this only adds the
  // localized inline line for the pin limit and never a second toast.
  async function togglePin(conversation: Conversation) {
    if (conversation.version === undefined || pinPendingId) return;
    setPinPendingId(conversation.id);
    setStatusError(null);
    try {
      if (conversation.pinned) await adminService.unpinConversation(conversation.id, conversation.version);
      else await adminService.pinConversation(conversation.id, conversation.version);
      void mutateConversations();
    } catch (thrown) {
      if (conversation.id === selected?.id) {
        setStatusError(isPinLimitError(thrown) ? t("pinLimit") : thrown instanceof Error ? thrown.message : t("pinFailed"));
      }
      void mutateConversations();
    } finally {
      setPinPendingId(null);
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
          onTogglePin={canPin ? (conversation) => void togglePin(conversation) : undefined}
          pinPendingId={pinPendingId}
        />
        {selected ? (
          <MessageThread
            customer={selected.customer}
            messages={messages}
            draft={draft}
            onDraftChange={setDraft}
            attachments={attachments}
            onAttachPhotos={attachPhotos}
            onRemovePhoto={removePhoto}
            onMessageAction={canWrite ? (action, messageId) => runMessageAction(action, messageId) : undefined}
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
                ? () => void changeStatus(conversationArchiveAction(selected.status))
                : undefined
            }
            archived={selected.status === "archived"}
            pinned={selected.pinned}
            pinPending={pinPendingId === selected.id}
            onTogglePin={
              canPin && selected.version !== undefined && selected.status !== "archived"
                ? () => void togglePin(selected)
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
