export type ConversationStatus = "unread" | "read" | "archived";

export type MessageCustomer = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
};

export type ChatMessage = {
  readonly id: string;
  readonly sender: "customer" | "salon";
  readonly content: string;
  /** Clock time for display, already localised: "08:13". */
  readonly time: string;
  /** The raw ISO timestamp, kept so the thread can group by day. */
  readonly sentAt: string;
};

export type Conversation = {
  readonly id: string;
  readonly customer: MessageCustomer;
  readonly preview: string;
  readonly timeLabel: string;
  readonly unreadCount: number;
  readonly status: ConversationStatus;
  readonly messages: ReadonlyArray<ChatMessage>;
  // Present when adapted from useAdminConversations; drives the mark-read /
  // archive header actions in MessageThread.
  readonly version?: number;
};
