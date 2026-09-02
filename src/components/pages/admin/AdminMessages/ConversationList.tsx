import { Avatar, Button, Tabs } from "@heroui/react";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import type { Conversation, ConversationStatus } from "./data";

export type InboxFilter = "all" | ConversationStatus;

const inboxTabClassName =
  "whitespace-nowrap px-2 text-xs font-medium";

type ConversationListProps = {
  readonly conversations: ReadonlyArray<Conversation>;
  readonly selectedId: string | null;
  readonly filter: InboxFilter;
  readonly query: string;
  readonly onFilterChange: (value: InboxFilter) => void;
  readonly onQueryChange: (value: string) => void;
  readonly onSelect: (id: string) => void;
};

export function ConversationList({
  conversations,
  selectedId,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onSelect,
}: ConversationListProps) {
  return (
    <section
      aria-labelledby="inbox-heading"
      /* The card is a fixed height now, so this column has to scroll on its own
         or a long inbox would push straight through the bottom of it. The
         search and the filters stay put while the list moves under them. */
      className="flex min-h-0 min-w-0 flex-col border-r border-admin-border bg-admin-surface"
    >
      <div className="shrink-0 space-y-3 border-b border-admin-border p-3">
        <h2 id="inbox-heading" className="font-bold">Hộp thư</h2>
        <AdminSearchField label="Tìm tin nhắn" placeholder="Tìm kiếm tin nhắn..." value={query} onChange={onQueryChange} />
        <Tabs selectedKey={filter} onSelectionChange={(key) => onFilterChange(String(key) as InboxFilter)} variant="secondary">
          <Tabs.ListContainer className="max-w-full overflow-x-auto">
            <Tabs.List aria-label="Lọc hộp thư">
              <Tabs.Tab id="all" className={inboxTabClassName}>
                Tất cả
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="unread" className={inboxTabClassName}>
                Chưa đọc
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="read" className={inboxTabClassName}>
                Đã đọc
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="archived" className={inboxTabClassName}>
                Lưu trữ
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-admin-border overflow-y-auto">
        {conversations.map((conversation) => {
          const isSelected = selectedId === conversation.id;
          const isUnread = conversation.unreadCount > 0;
          return (
            <li key={conversation.id}>
              <Button
                variant="ghost"
                onPress={() => onSelect(conversation.id)}
                /* A 4px bar marks the open thread. The row used to say so with
                   a pink wash alone, which is the same wash an unread row wants
                   for itself — so "open" and "unread" were competing for one
                   signal and neither won. */
                className={`h-auto min-h-[4.5rem] w-full justify-start rounded-none border-l-4 px-3 py-3 text-left ${
                  isSelected ? "border-l-admin-accent bg-admin-soft" : "border-l-transparent"
                }`}
              >
                <Avatar size="sm" color="accent" className="shrink-0">
                  <Avatar.Fallback>
                    {conversation.customer.initials}
                  </Avatar.Fallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <strong className={`min-w-0 flex-1 truncate text-sm ${isUnread ? "font-bold text-admin-ink" : "font-medium text-admin-ink"}`}>
                      {conversation.customer.name}
                    </strong>
                    <span className={`shrink-0 whitespace-nowrap text-[0.68rem] ${isUnread ? "font-semibold text-admin-accent" : "text-admin-muted"}`}>
                      {conversation.timeLabel}
                    </span>
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-2">
                    <span className={`min-w-0 flex-1 truncate text-xs ${isUnread ? "font-medium text-admin-ink" : "text-admin-muted"}`}>
                      {conversation.preview || "Chưa có tin nhắn"}
                    </span>
                    {isUnread ? (
                      <span
                        aria-label={`${conversation.unreadCount} tin chưa đọc`}
                        className="grid size-5 shrink-0 place-items-center rounded-full bg-admin-accent text-[0.65rem] font-bold text-white"
                      >
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
      {conversations.length === 0 ? (
        <p role="status" className="p-8 text-center text-sm text-admin-muted">
          Không tìm thấy cuộc hội thoại.
        </p>
      ) : null}
    </section>
  );
}
