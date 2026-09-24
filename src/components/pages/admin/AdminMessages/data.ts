export type ConversationStatus = "unread" | "read" | "archived";

export type MessageCustomer = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
};

export type BookingConfirmation = {
  readonly appointmentId: string;
  readonly appointmentCode: string;
  readonly branchId: string;
  readonly branchName?: string;
  readonly branchAddress?: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly serviceName: string;
  readonly optionNames: ReadonlyArray<string>;
  readonly staffName: string;
  readonly startAt: string;
  readonly durationMinutes: number;
  readonly totalJpy: number;
  readonly branchTimeZone: string;
  readonly note: string;
  readonly expectedPaymentMethod?: "CASH" | "PAYPAY" | "VISA" | null;
};

export type AppointmentCancellationNotice = {
  readonly appointmentId: string;
  readonly appointmentCode: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly branchAddress: string;
  readonly serviceName: string;
  readonly optionNames: ReadonlyArray<string>;
  readonly startAt: string;
  readonly branchTimeZone: string;
  readonly cancelledBy: "CUSTOMER" | "SALON";
  readonly cancelledAt: string;
  readonly reasonCode: string;
};

export type PaymentRecordedNotice = {
  readonly appointmentId: string;
  readonly paymentId: string;
  readonly branchId: string;
  readonly amountJpy: number;
  readonly method: "CASH" | "PAYPAY" | "VISA" | "NO_CHARGE";
  readonly recordedAt: string;
};

export type WarrantyNotice = {
  readonly warrantyId: string;
  readonly appointmentId: string;
  readonly branchId: string;
  readonly serviceId: string;
  readonly serviceName: string;
  readonly warrantyDays: number;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly locale: "vi" | "ja";
};

type ChatMessageBase = {
  readonly id: string;
  /** Clock time for display, already localised: "08:13". */
  readonly time: string;
  /** The raw ISO timestamp, kept so the thread can group by day. */
  readonly sentAt: string;
};

export type ChatTextMessage = ChatMessageBase & {
  readonly kind: "text";
  readonly sender: "customer" | "salon";
  readonly content: string;
};

export type ChatBookingConfirmationMessage = ChatMessageBase & {
  readonly kind: "booking-confirmation";
  readonly sender: "system";
  readonly booking: BookingConfirmation;
};

export type ChatWarrantyNoticeMessage = ChatMessageBase & {
  readonly kind: "warranty-notice";
  readonly sender: "system";
  readonly warranty: WarrantyNotice;
};

export type ChatAppointmentCancellationMessage = ChatMessageBase & {
  readonly kind: "appointment-cancelled";
  readonly sender: "system";
  readonly cancellation: AppointmentCancellationNotice;
};

export type ChatPaymentRecordedMessage = ChatMessageBase & {
  readonly kind: "payment-recorded";
  readonly sender: "system";
  readonly payment: PaymentRecordedNotice;
};

export type ChatMessage = ChatTextMessage | ChatBookingConfirmationMessage | ChatWarrantyNoticeMessage | ChatAppointmentCancellationMessage | ChatPaymentRecordedMessage;

export type Conversation = {
  readonly id: string;
  readonly customer: MessageCustomer;
  readonly preview: string;
  readonly timeLabel: string;
  readonly unreadCount: number;
  readonly status: ConversationStatus;
  /** Pinned for the whole salon; the API already lists pinned conversations first. */
  readonly pinned: boolean;
  readonly messages: ReadonlyArray<ChatMessage>;
  // Present when adapted from useAdminConversations; drives the mark-read /
  // archive header actions in MessageThread.
  readonly version?: number;
};
