export type MetricIcon = "calendar" | "revenue" | "customers" | "staff";
export type MetricTone = "accent" | "success" | "info" | "violet";

export type DashboardMetric = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly detail: string;
  readonly trend?: string;
  readonly icon: MetricIcon;
  readonly tone: MetricTone;
};

export type Appointment = {
  readonly id: string;
  readonly time: string;
  readonly customer: string;
  readonly service: string;
  readonly status: "Đã xác nhận" | "Chờ xác nhận";
};

export type StaffMember = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly status: "Đang làm" | "Nghỉ";
  readonly revenue: string;
  readonly payout: string;
};

export const dashboardMetrics: ReadonlyArray<DashboardMetric> = [
  {
    id: "appointments",
    label: "Lịch hẹn hôm nay",
    value: "12",
    unit: "lịch",
    detail: "Đã xác nhận: 10 · Chờ xác nhận: 2",
    icon: "calendar",
    tone: "accent",
  },
  {
    id: "revenue",
    label: "Doanh thu hôm nay",
    value: "7.860.000 ₫",
    detail: "So với hôm qua",
    trend: "+18,6%",
    icon: "revenue",
    tone: "success",
  },
  {
    id: "customers",
    label: "Khách hôm nay",
    value: "10",
    unit: "người",
    detail: "Khách mới: 2",
    icon: "customers",
    tone: "info",
  },
  {
    id: "staff",
    label: "Nhân viên đang làm",
    value: "3 / 4",
    unit: "người",
    detail: "1 người nghỉ",
    icon: "staff",
    tone: "violet",
  },
];

export const appointments: ReadonlyArray<Appointment> = [
  { id: "a1", time: "10:00", customer: "Nguyễn Thu Hương", service: "Sơn gel đơn sắc", status: "Đã xác nhận" },
  { id: "a2", time: "12:00", customer: "Trần Mỹ Linh", service: "Thiết kế mang theo", status: "Đã xác nhận" },
  { id: "a3", time: "14:00", customer: "Lê Khánh An", service: "Gradient + Nối dài", status: "Đã xác nhận" },
  { id: "a4", time: "16:00", customer: "Phạm Quỳnh Mai", service: "French Nail", status: "Đã xác nhận" },
  { id: "a5", time: "18:00", customer: "Hoàng Bảo Ngọc", service: "Sơn gel ombre", status: "Chờ xác nhận" },
];

export const revenueRows = [
  { id: "gross", label: "Tổng doanh thu", value: "7.860.000 ₫" },
  { id: "cost", label: "Tổng chi phí (vật tư, khác)", value: "1.230.000 ₫" },
  { id: "commission", label: "Tổng hoa hồng nhân viên", value: "3.548.000 ₫" },
] as const;

export const paymentMethods = [
  { id: "cash", label: "Tiền mặt", value: "4.560.000 ₫" },
  { id: "transfer", label: "Chuyển khoản", value: "2.800.000 ₫" },
  { id: "paypay", label: "PayPay", value: "500.000 ₫" },
] as const;

export const notifications = [
  { id: "n1", kind: "appointment", title: "Có 2 lịch hẹn chờ xác nhận", detail: "Vui lòng xác nhận", time: "5 phút trước" },
  { id: "n2", kind: "revenue", title: "Doanh thu hôm qua", detail: "6.630.000 ₫", time: "Hôm qua" },
  { id: "n3", kind: "reminder", title: "Nhắc nhân viên nộp lịch làm việc", detail: "Hạn nộp: 18/08/2026", time: "1 ngày trước" },
] as const;

export const staffMembers: ReadonlyArray<StaffMember> = [
  { id: "s1", name: "Mai Linh", initials: "ML", status: "Đang làm", revenue: "2.680.000 ₫", payout: "1.608.000 ₫" },
  { id: "s2", name: "Thảo Vy", initials: "TV", status: "Đang làm", revenue: "2.340.000 ₫", payout: "1.404.000 ₫" },
  { id: "s3", name: "Quỳnh Anh", initials: "QA", status: "Đang làm", revenue: "2.840.000 ₫", payout: "1.704.000 ₫" },
  { id: "s4", name: "Bảo Ngọc", initials: "BN", status: "Nghỉ", revenue: "0 ₫", payout: "0 ₫" },
];

export const monthlySummary = [
  { id: "revenue", label: "Doanh thu tháng", value: "124.560.000 ₫" },
  { id: "cost", label: "Chi phí tháng", value: "18.530.000 ₫" },
  { id: "commission", label: "Hoa hồng nhân viên", value: "56.822.000 ₫" },
] as const;
