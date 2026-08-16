"use client";

import { Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminEmptySelection } from "@/components/blocks/admin/AdminEmptySelection";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { resolveVisibleSelection } from "@/lib/admin-selection";
import { ConversationList, type InboxFilter } from "./ConversationList";
import { CustomerSummary } from "./CustomerSummary";
import { MessageThread } from "./MessageThread";
import { conversations } from "./data";
import {
  appendConversationMessage,
  type ConversationMessages,
} from "./state";

export function AdminMessagesComponent() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<ConversationMessages>({});
  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return conversations.filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!normalized || `${item.customer.name} ${item.preview}`.toLocaleLowerCase("vi").includes(normalized)),
    );
  }, [filter, query]);
  const selected = resolveVisibleSelection(visibleConversations, selectedId);
  const messages = selected
    ? [...selected.messages, ...(localMessages[selected.id] ?? [])]
    : [];

  const sendMessage = () => {
    const content = draft.trim();
    if (!selected) return;
    if (!content) return;
    setLocalMessages((messagesByConversation) =>
      appendConversationMessage(messagesByConversation, selected.id, {
        id: `local-${selected.id}-${(messagesByConversation[selected.id]?.length ?? 0) + 1}`,
        sender: "salon",
        content,
        time: "Bây giờ",
      }),
    );
    setDraft("");
  };

  return (
    <AdminPageLayout>
      <Card className="grid gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
        <ConversationList
          conversations={visibleConversations}
          selectedId={selected?.id ?? null}
          filter={filter}
          query={query}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onSelect={setSelectedId}
        />
        {selected ? (
          <MessageThread customer={selected.customer} messages={messages} draft={draft} onDraftChange={setDraft} onSend={sendMessage} />
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
