import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, InputGroup } from "@heroui/react";
import type { FormEvent } from "react";
import type { ChatMessage, MessageCustomer } from "./data";

type MessageThreadProps = {
  readonly customer: MessageCustomer;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: string;
  readonly onDraftChange: (value: string) => void;
  readonly onSend: () => void;
};

export function MessageThread({ customer, messages, draft, onDraftChange, onSend }: MessageThreadProps) {
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
        <div className="min-w-0">
          <h2 id="thread-heading" className="truncate font-bold">
            {customer.name}
          </h2>
          <p className="truncate text-xs text-admin-muted">{customer.phone}</p>
        </div>
      </header>
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
        <InputGroup fullWidth>
          <InputGroup.Prefix><PaperClipIcon className="size-4 text-admin-muted" /></InputGroup.Prefix>
          <InputGroup.Input aria-label="Nhập tin nhắn" placeholder="Nhập tin nhắn..." value={draft} onChange={(event) => onDraftChange(event.target.value)} />
          <InputGroup.Suffix><Button type="submit" size="sm" variant="primary" isDisabled={!draft.trim()} className="rounded-lg"><PaperAirplaneIcon className="size-4" />Gửi</Button></InputGroup.Suffix>
        </InputGroup>
      </form>
    </section>
  );
}
