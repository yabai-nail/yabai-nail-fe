import type { CustomerSegment } from "@/lib/admin-customer";

export type ConversationStatus = "unread" | "read" | "archived";

export type MessageCustomer = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly birthday: string;
  readonly preference: string;
  readonly totalSpend: number;
  readonly visits: number;
  readonly points: number;
  readonly segment: CustomerSegment;
};

export type ChatMessage = {
  readonly id: string;
  readonly sender: "customer" | "salon";
  readonly content: string;
  readonly time: string;
};

export type Conversation = {
  readonly id: string;
  readonly customer: MessageCustomer;
  readonly preview: string;
  readonly timeLabel: string;
  readonly unreadCount: number;
  readonly status: ConversationStatus;
  readonly messages: ReadonlyArray<ChatMessage>;
};

const baseMessages: ReadonlyArray<ChatMessage> = [
  { id: "m1", sender: "customer", content: "Chào tiệm ạ! Mình muốn đặt lịch làm nail ngày cuối tuần này. Còn lịch trống không ạ?", time: "10:28" },
  { id: "m2", sender: "salon", content: "Chào bạn Hương! Cuối tuần này bên mình còn lịch lúc 10:00, 14:00 và 16:00. Bạn muốn đặt vào khung giờ nào ạ?", time: "10:30" },
  { id: "m3", sender: "customer", content: "Mình muốn đặt lịch thứ 7 lúc 14:00 nhé! Mình làm sơn gel đơn sắc màu nude.", time: "10:31" },
  { id: "m4", sender: "salon", content: "Dạ vâng, mình đã giữ lịch cho bạn thứ 7 lúc 14:00 ạ. Bạn vui lòng đến đúng giờ giúp mình nhé!", time: "10:32" },
  { id: "m5", sender: "customer", content: "Cảm ơn bạn nhé 💗", time: "10:33" },
];

export const conversations: ReadonlyArray<Conversation> = [
  { id: "cv1", customer: { id: "c1", name: "Nguyễn Thu Hương", initials: "NH", phone: "0901 234 567", birthday: "25/06/1996", preference: "Thích tone hồng, nail dài vừa phải.", totalSpend: 18560000, visits: 42, points: 1250, segment: "loyal" }, preview: "Cho mình hỏi còn lịch trống ngày...", timeLabel: "10:30", unreadCount: 2, status: "unread", messages: baseMessages },
  { id: "cv2", customer: { id: "c2", name: "Trần Mỹ Linh", initials: "TL", phone: "0912 345 678", birthday: "11/09/1998", preference: "Thiết kế theo mẫu.", totalSpend: 9850000, visits: 28, points: 820, segment: "loyal" }, preview: "Cảm ơn bạn nhé 💗", timeLabel: "09:15", unreadCount: 1, status: "unread", messages: baseMessages.slice(0, 3) },
  { id: "cv3", customer: { id: "c3", name: "Lê Khánh An", initials: "LA", phone: "0932 111 222", birthday: "08/03/1997", preference: "Gradient và đính đá.", totalSpend: 7420000, visits: 22, points: 650, segment: "loyal" }, preview: "Mình cần đổi lịch hẹn ạ", timeLabel: "Hôm qua", unreadCount: 1, status: "unread", messages: baseMessages.slice(0, 2) },
  { id: "cv4", customer: { id: "c4", name: "Phạm Quỳnh Mai", initials: "PM", phone: "0903 456 789", birthday: "19/12/1995", preference: "French Nail, tone nude.", totalSpend: 6880000, visits: 18, points: 610, segment: "loyal" }, preview: "Bạn có mẫu nail màu hồng nude...", timeLabel: "Hôm qua", unreadCount: 0, status: "read", messages: baseMessages.slice(1, 4) },
  { id: "cv5", customer: { id: "c5", name: "Hoàng Bảo Ngọc", initials: "HN", phone: "0911 222 333", birthday: "04/01/1999", preference: "Sơn gel ombre.", totalSpend: 5320000, visits: 15, points: 420, segment: "regular" }, preview: "Mình muốn đặt lịch làm móng...", timeLabel: "2 ngày", unreadCount: 0, status: "archived", messages: baseMessages.slice(0, 1) },
];
