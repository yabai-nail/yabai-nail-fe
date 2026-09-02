"use client";

import { useTranslations } from "next-intl";
import { Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { notifySuccess } from "@/lib/app-toast";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  adminService,
  useAdminConversations,
  useAdminConversationMessages,
  type AdminConversation as ServerConversation,
  type AdminMessage as ServerMessage,
} from "@/service";
import { ConversationList, type InboxFilter } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { type ChatMessage, type Conversation, type MessageCustomer } from "./data";
import {
  appendConversationMessage,
  type ConversationMessages,
} from "./state";

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function formatTimeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
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

function toFixtureConversation(server: ServerConversation, unnamed: string): Conversation {
  const status = server.status.toLowerCase();
  const normalizedStatus =
    status === "unread" || status === "read" || status === "archived" ? status : "read";
  return {
    id: server.id,
    customer: toFixtureCustomer(server, unnamed),
    preview: server.lastMessage?.content ?? "",
    timeLabel: server.lastMessage ? formatTimeLabel(server.lastMessage.createdAt) : "",
    unreadCount: server.unreadCount,
    status: normalizedStatus,
    messages: [],
    version: server.version,
  };
}

function toChatMessage(server: ServerMessage): ChatMessage {
  const sender = server.senderType.toLowerCase().includes("customer") ? "customer" : "salon";
  return {
    id: server.id,
    sender,
    content: server.content,
    time: formatTimeLabel(server.createdAt),
    sentAt: server.createdAt,
  };
}

export function AdminMessagesComponent() {
  const t = useTranslations("admin.messages");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<ConversationMessages>({});

  const { data: conversationsData, error: conversationsError, mutate: mutateConversations } = useAdminConversations();
  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const source = useMemo<ReadonlyArray<Conversation>>(() => {
    return conversationsData?.items?.map((server) => toFixtureConversation(server, t("unnamedCustomer"))) ?? [];
  }, [conversationsData, t]);

  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return source.filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!normalized || `${item.customer.name} ${item.preview}`.toLocaleLowerCase("vi").includes(normalized)),
    );
  }, [source, filter, query]);
  const selected = resolveVisibleSelection(visibleConversations, selectedId || visibleConversations[0]?.id || "");

  const shouldFetchThread = Boolean(selected);
  const { data: threadData, error: threadError, mutate: mutateThread } = useAdminConversationMessages(
    shouldFetchThread ? selected?.id ?? null : null,
  );

  const messages = useMemo(() => {
    if (!selected) return [];
    const serverThread = threadData?.items ? threadData.items.map(toChatMessage) : selected.messages;
    return [...serverThread, ...(localMessages[selected.id] ?? [])];
  }, [selected, threadData, localMessages]);

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
      notifySuccess(next === "ARCHIVED" ? "Đã lưu trữ hội thoại" : "Đã cập nhật trạng thái hội thoại");
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
            statusPending={statusPending}
            statusError={threadError ? t("threadLoadFailed") : statusError}
            sendPending={sendPending}
            sendError={sendError}
            onMarkRead={
              selected.version !== undefined
                ? () => void changeStatus("READ")
                : undefined
            }
            onArchive={
              selected.version !== undefined
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
