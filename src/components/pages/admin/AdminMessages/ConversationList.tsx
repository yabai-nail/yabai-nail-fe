import { useTranslations } from "next-intl";
import { Avatar, Button, Tabs } from "@heroui/react";
import { BookmarkIcon, BookmarkSlashIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import type { Conversation, ConversationStatus } from "./data";
import { pinnedBoundaryIndex } from "./pins";

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
  readonly onTogglePin?: (conversation: Conversation) => void;
  readonly pinPendingId?: string | null;
};

export function ConversationList({
  conversations,
  selectedId,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onSelect,
  onTogglePin,
  pinPendingId,
}: ConversationListProps) {
  const t = useTranslations("admin.messages");
  const boundary = pinnedBoundaryIndex(conversations);
  return (
    <section
      aria-labelledby="inbox-heading"
      /* The card is a fixed height now, so this column has to scroll on its own
         or a long inbox would push straight through the bottom of it. The
         search and the filters stay put while the list moves under them. */
      className="flex min-h-0 min-w-0 flex-col border-r border-admin-border bg-admin-surface"
    >
      <div className="shrink-0 space-y-3 border-b border-admin-border p-3">
        <h2 id="inbox-heading" className="font-bold">{t("inbox")}</h2>
        <AdminSearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={onQueryChange} />
        <Tabs selectedKey={filter} onSelectionChange={(key) => onFilterChange(String(key) as InboxFilter)} variant="secondary">
          <Tabs.ListContainer className="max-w-full overflow-x-auto">
            <Tabs.List aria-label={t("filterLabel")}>
              <Tabs.Tab id="all" className={inboxTabClassName}>
                {t("tabs.all")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="unread" className={inboxTabClassName}>
                {t("tabs.unread")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="read" className={inboxTabClassName}>
                {t("tabs.read")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="archived" className={inboxTabClassName}>
                {t("tabs.archived")}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-admin-border overflow-y-auto">
        {conversations.map((conversation, index) => {
          const isSelected = selectedId === conversation.id;
          const isUnread = conversation.unreadCount > 0;
          return (
            <li key={conversation.id} className="group relative">
              {boundary > 0 && index === 0 ? (
                <p className="bg-admin-soft/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-admin-muted">
                  {t("pinnedSection")}
                </p>
              ) : null}
              {index === boundary ? (
                <p className="bg-admin-soft/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-admin-muted">
                  {t("otherSection")}
                </p>
              ) : null}
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
                    {conversation.pinned ? <BookmarkSolidIcon aria-label={t("pinnedSection")} className="size-3.5 shrink-0 text-admin-accent" /> : null}
                    <strong className={`min-w-0 flex-1 truncate text-sm ${isUnread ? "font-bold text-admin-ink" : "font-medium text-admin-ink"}`}>
                      {conversation.customer.name}
                    </strong>
                    <span className={`shrink-0 whitespace-nowrap text-[0.68rem] ${isUnread ? "font-semibold text-admin-accent" : "text-admin-muted"}`}>
                      {conversation.timeLabel}
                    </span>
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-2">
                    <span className={`min-w-0 flex-1 truncate text-xs ${isUnread ? "font-medium text-admin-ink" : "text-admin-muted"}`}>
                      {conversation.preview || t("noMessages")}
                    </span>
                    {isUnread ? (
                      <span
                        aria-label={t("unreadCount", { count: conversation.unreadCount })}
                        className="grid size-5 shrink-0 place-items-center rounded-full bg-admin-accent text-[0.65rem] font-bold text-admin-on-accent"
                      >
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </Button>
              {onTogglePin ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={conversation.pinned ? t("unpin") : t("pin")}
                  isDisabled={pinPendingId === conversation.id}
                  onPress={() => onTogglePin(conversation)}
                  className={`absolute right-2 top-2 bg-admin-surface ${
                    isSelected ? "opacity-100" : "opacity-0 focus:opacity-100 group-hover:opacity-100"
                  }`}
                >
                  {conversation.pinned ? <BookmarkSlashIcon className="size-4" /> : <BookmarkIcon className="size-4" />}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {conversations.length === 0 ? (
        <p role="status" className="p-8 text-center text-sm text-admin-muted">
          {t("noConversations")}
        </p>
      ) : null}
    </section>
  );
}
