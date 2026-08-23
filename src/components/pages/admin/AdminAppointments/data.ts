import type { CustomerSegment } from "@/lib/admin-customer";

export type AppointmentStatus = "confirmed" | "pending" | "cancelled";
export type AppointmentStatusFilter = "all" | AppointmentStatus;
export type AppointmentView = "day" | "week" | "month";

export type AppointmentCustomer = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly birthday: string;
  readonly segment: CustomerSegment;
  readonly preference: string;
  readonly visits: number;
  readonly totalSpend: number;
};

export type AppointmentService = {
  readonly id: string;
  readonly name: string;
  readonly durationMinutes: number;
};

export type AppointmentStaff = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
};

export type AppointmentDraft = {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly customer: AppointmentCustomer;
  readonly service: AppointmentService;
  readonly staff: AppointmentStaff;
  readonly status: AppointmentStatus;
  readonly note: string;
};

export type Appointment = AppointmentDraft & {
  readonly id: string;
  // Raw BE state machine label (CONFIRMED, CHECKED_IN, IN_SERVICE, …). Present
  // only for server-backed rows; absent for local overlays so the lifecycle
  // action bar can hide itself for pre-persistence intents.
  readonly serverStatus?: string;
  // Row version used for `If-Match` on lifecycle transitions.
  readonly version?: number;
};

// BE lifecycle transitions the detail panel exposes as action buttons. The
// enum stays here (not in status.ts) so the mock data file is the single
// source of truth for what the fixture Appointment shape can carry.
export type AppointmentLifecycleAction =
  | "check-in"
  | "service-start"
  | "service-complete"
  | "no-show";

export const DEFAULT_APPOINTMENT_DATE = "2026-08-16";

export const appointmentCustomers: ReadonlyArray<AppointmentCustomer> = [
  {
    id: "customer-1",
    name: "Nguyễn Thu Hương",
    initials: "NH",
    phone: "0901 234 567",
    birthday: "25/06/1996",
    segment: "loyal",
    preference: "Thích tone hồng, nail dài vừa phải.",
    visits: 42,
    totalSpend: 18_560_000,
  },
  {
    id: "customer-2",
    name: "Trần Mỹ Linh",
    initials: "TL",
    phone: "0912 345 678",
    birthday: "14/09/1998",
    segment: "loyal",
    preference: "Ưu tiên mẫu nhẹ, form móng ngắn.",
    visits: 28,
    totalSpend: 9_850_000,
  },
  {
    id: "customer-3",
    name: "Lê Khánh An",
    initials: "LA",
    phone: "0932 111 222",
    birthday: "08/11/1997",
    segment: "loyal",
    preference: "Thích gradient và đính đá nhỏ.",
    visits: 21,
    totalSpend: 7_420_000,
  },
  {
    id: "customer-4",
    name: "Phạm Quỳnh Mai",
    initials: "PM",
    phone: "0903 456 789",
    birthday: "03/04/1995",
    segment: "loyal",
    preference: "Thường chọn French Nail tự nhiên.",
    visits: 18,
    totalSpend: 6_880_000,
  },
  {
    id: "customer-5",
    name: "Hoàng Bảo Ngọc",
    initials: "HN",
    phone: "0911 222 333",
    birthday: "19/02/2000",
    segment: "regular",
    preference: "Yêu thích màu nude và ombre.",
    visits: 12,
    totalSpend: 5_320_000,
  },
];

export const appointmentServices: ReadonlyArray<AppointmentService> = [
  { id: "service-1", name: "Sơn gel đơn sắc", durationMinutes: 90 },
  { id: "service-2", name: "Thiết kế theo mẫu", durationMinutes: 90 },
  { id: "service-3", name: "Gradient + Nối dài", durationMinutes: 90 },
  { id: "service-4", name: "French Nail", durationMinutes: 90 },
  { id: "service-5", name: "Sơn gel ombre", durationMinutes: 60 },
];

export const appointmentStaff: ReadonlyArray<AppointmentStaff> = [
  { id: "staff-1", name: "Mai Linh", initials: "ML" },
  { id: "staff-2", name: "Thảo Vy", initials: "TV" },
  { id: "staff-3", name: "Quỳnh Anh", initials: "QA" },
];

const [thuHuong, myLinh, khanhAn, quynhMai, baoNgoc] = appointmentCustomers;
const [solidGel, customDesign, gradient, frenchNail, ombre] = appointmentServices;
const [maiLinh, thaoVy, quynhAnh] = appointmentStaff;

export const initialAppointments: ReadonlyArray<Appointment> = [
  { id: "appointment-1", date: DEFAULT_APPOINTMENT_DATE, startTime: "10:00", endTime: "11:30", customer: thuHuong, service: solidGel, staff: maiLinh, status: "confirmed", note: "Khách muốn tone hồng nude." },
  { id: "appointment-2", date: DEFAULT_APPOINTMENT_DATE, startTime: "12:00", endTime: "13:30", customer: myLinh, service: customDesign, staff: thaoVy, status: "confirmed", note: "Khách mang theo ảnh mẫu." },
  { id: "appointment-3", date: DEFAULT_APPOINTMENT_DATE, startTime: "14:00", endTime: "15:30", customer: khanhAn, service: gradient, staff: quynhAnh, status: "confirmed", note: "Đính đá nhỏ ở hai ngón." },
  { id: "appointment-4", date: DEFAULT_APPOINTMENT_DATE, startTime: "16:00", endTime: "17:30", customer: quynhMai, service: frenchNail, staff: maiLinh, status: "confirmed", note: "Form móng vuông bo nhẹ." },
  { id: "appointment-5", date: DEFAULT_APPOINTMENT_DATE, startTime: "18:00", endTime: "19:00", customer: baoNgoc, service: ombre, staff: thaoVy, status: "pending", note: "Chờ khách xác nhận màu." },
  { id: "appointment-6", date: "2026-08-14", startTime: "11:00", endTime: "12:30", customer: thuHuong, service: customDesign, staff: quynhAnh, status: "confirmed", note: "" },
  { id: "appointment-7", date: "2026-08-15", startTime: "09:30", endTime: "11:00", customer: myLinh, service: solidGel, staff: maiLinh, status: "confirmed", note: "" },
  { id: "appointment-8", date: "2026-08-17", startTime: "10:00", endTime: "11:30", customer: khanhAn, service: gradient, staff: thaoVy, status: "pending", note: "" },
  { id: "appointment-9", date: "2026-08-18", startTime: "13:30", endTime: "15:00", customer: quynhMai, service: frenchNail, staff: quynhAnh, status: "confirmed", note: "" },
  { id: "appointment-10", date: "2026-08-20", startTime: "15:00", endTime: "16:00", customer: baoNgoc, service: ombre, staff: maiLinh, status: "cancelled", note: "Khách bận đột xuất." },
  { id: "appointment-11", date: "2026-08-22", startTime: "10:30", endTime: "12:00", customer: thuHuong, service: solidGel, staff: thaoVy, status: "confirmed", note: "" },
  { id: "appointment-12", date: "2026-08-24", startTime: "17:00", endTime: "18:30", customer: myLinh, service: customDesign, staff: quynhAnh, status: "pending", note: "" },
];
