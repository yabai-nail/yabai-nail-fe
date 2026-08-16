export type StaffStatus = "working" | "leave";

export type StaffMember = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly birthday: string;
  readonly status: StaffStatus;
  readonly revenue: number;
  readonly commissionRate: number;
  readonly orders: number;
};

export type RecentOrder = {
  readonly id: string;
  readonly time: string;
  readonly customer: string;
  readonly service: string;
  readonly total: number;
  readonly commission: number;
  readonly status: "paid" | "pending";
};

export const staffMembers: ReadonlyArray<StaffMember> = [
  { id: "s1", name: "Mai Linh", initials: "ML", phone: "0901 234 567", birthday: "25/06/1996", status: "working", revenue: 2840000, commissionRate: 60, orders: 4 },
  { id: "s2", name: "Thảo Vy", initials: "TV", phone: "0912 345 678", birthday: "11/09/1998", status: "working", revenue: 2340000, commissionRate: 60, orders: 3 },
  { id: "s3", name: "Quỳnh Anh", initials: "QA", phone: "0932 111 222", birthday: "08/03/1997", status: "working", revenue: 2840000, commissionRate: 60, orders: 3 },
  { id: "s4", name: "Bảo Ngọc", initials: "BN", phone: "0903 456 789", birthday: "19/12/1995", status: "leave", revenue: 0, commissionRate: 60, orders: 0 },
];

export const recentOrders: ReadonlyArray<RecentOrder> = [
  { id: "o1", time: "16:00", customer: "Nguyễn Thu Hương", service: "Sơn gel nâng cao", total: 950000, commission: 570000, status: "paid" },
  { id: "o2", time: "14:00", customer: "Trần Mỹ Linh", service: "Thiết kế theo mẫu", total: 1200000, commission: 720000, status: "paid" },
  { id: "o3", time: "12:00", customer: "Lê Khánh An", service: "Gradient + Đính đá", total: 890000, commission: 534000, status: "paid" },
  { id: "o4", time: "10:00", customer: "Phạm Quỳnh Mai", service: "Sơn gel đơn sắc", total: 600000, commission: 360000, status: "paid" },
  { id: "o5", time: "09:00", customer: "Hoàng Bảo Ngọc", service: "Đắp bột + Sơn gel", total: 780000, commission: 468000, status: "pending" },
];
