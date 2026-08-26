"use client";

import { Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import {
  adminService,
  useAdminConversations,
  useAdminConversationMessages,
  type AdminConversation as ServerConversation,
  type AdminMessage as ServerMessage,
} from "@/service";
import { ConversationList, type InboxFilter } from "./ConversationList";
import { CustomerSummary } from "./CustomerSummary";
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

function toFixtureCustomer(server: ServerConversation): MessageCustomer {
  const name = server.customer.displayName ?? "Khách chưa có tên";
  return {
    id: server.customer.customerId,
    name,
    initials: deriveInitials(name),
    phone: server.customer.phone ?? "",
  };
}

function toFixtureConversation(server: ServerConversation): Conversation {
  const status = server.status.toLowerCase();
  const normalizedStatus =
    status === "unread" || status === "read" || status === "archived" ? status : "read";
  return {
    id: server.id,
    customer: toFixtureCustomer(server),
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
  };
}

export function AdminMessagesComponent() {
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
    return conversationsData?.items?.map(toFixtureConversation) ?? [];
  }, [conversationsData]);

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
        time: "Bây giờ",
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
        setSendError(thrown instanceof Error ? thrown.message : "Không gửi được tin nhắn.");
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
      void mutateConversations();
    } catch (thrown) {
      setStatusError(
        thrown instanceof Error ? thrown.message : "Không cập nhật được trạng thái hội thoại.",
      );
    } finally {
      setStatusPending(false);
    }
  }

  return (
    <AdminPageLayout>
      {conversationsError ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được hội thoại.</p>
      ) : null}
      <Card className="grid gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
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
            statusError={threadError ? "Không tải được nội dung hội thoại." : statusError}
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
          <AdminEmptySelection title="Không có hội thoại" description="Thay đổi từ khóa hoặc bộ lọc để tiếp tục nhắn tin." />
        )}
        {selected ? (
          <CustomerSummary customer={selected.customer} />
        ) : (
          <AdminEmptySelection title="Chưa có khách hàng" description="Thông tin khách hàng sẽ xuất hiện khi có hội thoại phù hợp." />
        )}
      </Card>
    </AdminPageLayout>
  );
}

export const meta = { world: "connected", domain: "admin-messages" } as const;
