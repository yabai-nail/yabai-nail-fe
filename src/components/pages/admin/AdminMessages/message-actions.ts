import type { ChatTextMessage } from "./data";

/** Mirrors the API: a message can be recalled for both sides within 15 minutes of sending. */
export const RECALL_WINDOW_MS = 15 * 60_000;

export type MessageActionKey = "copy" | "recall" | "hide";

/**
 * What the per-message menu offers. Recall is only offered on salon messages still inside the
 * window (the API still decides who may recall a colleague's message); a bubble still being
 * sent has no server id yet, so it gets nothing.
 */
export function availableMessageActions(message: ChatTextMessage, now: number): ReadonlyArray<MessageActionKey> {
  if (message.id.startsWith("local-")) return [];
  if (message.recalled) return ["hide"];
  const actions: MessageActionKey[] = [];
  if (message.content.trim()) actions.push("copy");
  const sentAt = Date.parse(message.sentAt);
  if (message.sender === "salon" && Number.isFinite(sentAt) && now - sentAt <= RECALL_WINDOW_MS) actions.push("recall");
  actions.push("hide");
  return actions;
}
