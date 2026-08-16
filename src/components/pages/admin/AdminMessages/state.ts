import type { ChatMessage } from "./data";

export type ConversationMessages = Readonly<
  Record<string, ReadonlyArray<ChatMessage>>
>;

export function appendConversationMessage(
  messagesByConversation: ConversationMessages,
  conversationId: string,
  message: ChatMessage,
): ConversationMessages {
  return {
    ...messagesByConversation,
    [conversationId]: [
      ...(messagesByConversation[conversationId] ?? []),
      message,
    ],
  };
}
