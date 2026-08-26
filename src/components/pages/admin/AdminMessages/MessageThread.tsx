import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Button, InputGroup } from "@heroui/react";
import type { FormEvent } from "react";
import type { ChatMessage, MessageCustomer } from "./data";

type MessageThreadProps = {
  readonly customer: MessageCustomer;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: string;
  readonly onDraftChange: (value: string) => void;
  readonly onSend: () => void;
  /** Fired when the admin marks the current thread read. Hidden if omitted. */
  readonly onMarkRead?: () => void;
  /** Fired when the admin archives the current thread. Hidden if omitted. */
  readonly onArchive?: () => void;
  readonly statusPending?: boolean;
  readonly statusError?: string | null;
  readonly sendPending?: boolean;
  readonly sendError?: string | null;
};

export function MessageThread({
  customer,
  messages,
  draft,
  onDraftChange,
  onSend,
  onMarkRead,
  onArchive,
  statusPending = false,
  statusError = null,
  sendPending = false,
  sendError = null,
}: MessageThreadProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend();
  };

  return (
    <section aria-labelledby="thread-heading" className="flex min-h-[38rem] min-w-0 flex-col bg-admin-surface">
      <header className="flex items-center gap-3 border-b border-admin-border px-4 py-3">
        <Avatar size="sm" color="accent" className="shrink-0">
          <Avatar.Fallback>{customer.initials}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 id="thread-heading" className="truncate font-bold">
            {customer.name}
          </h2>
          <p className="truncate text-xs text-admin-muted">{customer.phone}</p>
        </div>
        {onMarkRead ? (
          <Button size="sm" variant="ghost" onPress={onMarkRead} isDisabled={statusPending} aria-label="Đánh dấu đã đọc">
            <CheckCircleIcon className="size-4" />
          </Button>
        ) : null}
        {onArchive ? (
          <Button size="sm" variant="ghost" onPress={onArchive} isDisabled={statusPending} aria-label="Lưu trữ">
            <ArchiveBoxIcon className="size-4" />
          </Button>
        ) : null}
      </header>
      {statusError ? (
        <p role="alert" className="border-b border-admin-border bg-admin-surface px-4 py-2 text-xs text-admin-danger">
          {statusError}
        </p>
      ) : null}
      <ol aria-label={`Tin nhắn với ${customer.name}`} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <li key={message.id} className={`flex ${message.sender === "salon" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-lg border px-3 py-2 text-sm leading-6 ${message.sender === "salon" ? "border-admin-accent/10 bg-admin-soft" : "border-admin-border bg-admin-surface"}`}>
              <p>{message.content}</p>
              <time className="mt-1 block text-right text-[0.68rem] text-admin-muted">{message.time}</time>
            </div>
          </li>
        ))}
      </ol>
      <form onSubmit={submit} className="border-t border-admin-border p-3">
        {sendError ? <p role="alert" className="mb-2 text-xs text-admin-danger">{sendError}</p> : null}
        <InputGroup fullWidth>
          <InputGroup.Input aria-label="Nhập tin nhắn" maxLength={2000} placeholder="Nhập tin nhắn..." value={draft} onChange={(event) => onDraftChange(event.target.value)} />
          <InputGroup.Suffix><Button type="submit" size="sm" variant="primary" isDisabled={!draft.trim() || sendPending} className="rounded-lg"><PaperAirplaneIcon className="size-4" />Gửi</Button></InputGroup.Suffix>
        </InputGroup>
      </form>
    </section>
  );
}
