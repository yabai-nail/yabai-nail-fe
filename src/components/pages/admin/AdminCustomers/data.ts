import type { CustomerSegment } from "@/lib/admin-customer";

export type { CustomerSegment } from "@/lib/admin-customer";
export type CustomerRank = "gold" | "silver" | "bronze" | "none";

export type CustomerHistoryItem = {
  readonly id: string;
  readonly date: string;
  readonly service: string;
  readonly amount: number;
};

export type Customer = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly birthday: string;
  readonly handle: string;
  readonly preference: string;
  readonly lastVisit: string;
  readonly totalSpend: number;
  readonly points: number;
  readonly visits: number;
  readonly segment: CustomerSegment;
  readonly rank: CustomerRank;
  readonly note: string;
  // Server row identity. Present only when adapted from useAdminCustomers;
  // absent for fixture rows so mutation buttons hide themselves for the
  // design-time sample.
  readonly version?: number;
  readonly locale?: string;
  readonly status?: string;
};

export const customers: ReadonlyArray<Customer> = [
  { id: "c1", name: "Nguyễn Thu Hương", initials: "NH", phone: "0901 234 567", birthday: "25/06/1996", handle: "@huongnail_", preference: "Thích tone hồng, nail dài vừa phải.", lastVisit: "16/05/2025", totalSpend: 18560000, points: 1250, visits: 42, segment: "loyal", rank: "gold", note: "Khách thích tone hồng, nude, design nhẹ nhàng. Ưu tiên đặt lịch cuối tuần." },
  { id: "c2", name: "Trần Mỹ Linh", initials: "TL", phone: "0912 345 678", birthday: "11/09/1998", handle: "@mylinh", preference: "Ưa thiết kế theo mẫu.", lastVisit: "14/05/2025", totalSpend: 9850000, points: 820, visits: 28, segment: "loyal", rank: "silver", note: "Thường đặt lịch buổi chiều." },
  { id: "c3", name: "Lê Khánh An", initials: "LA", phone: "0932 111 222", birthday: "08/03/1997", handle: "@khanhan", preference: "Gradient và đính đá.", lastVisit: "13/05/2025", totalSpend: 7420000, points: 650, visits: 22, segment: "loyal", rank: "silver", note: "Ưu tiên nhân viên Quỳnh Anh." },
  { id: "c4", name: "Phạm Quỳnh Mai", initials: "PM", phone: "0903 456 789", birthday: "19/12/1995", handle: "@quynhmai", preference: "French Nail, tone nude.", lastVisit: "12/05/2025", totalSpend: 6880000, points: 610, visits: 18, segment: "loyal", rank: "silver", note: "Hay thay đổi lịch trước một ngày." },
  { id: "c5", name: "Hoàng Bảo Ngọc", initials: "HN", phone: "0911 222 333", birthday: "04/01/1999", handle: "@baongoc", preference: "Sơn gel ombre.", lastVisit: "10/05/2025", totalSpend: 5320000, points: 420, visits: 15, segment: "regular", rank: "bronze", note: "Khách lâu năm." },
  { id: "c6", name: "Đỗ Thu Trang", initials: "ĐT", phone: "0909 333 444", birthday: "27/07/2000", handle: "@thutrang", preference: "Nail ngắn, màu sáng.", lastVisit: "08/05/2025", totalSpend: 4150000, points: 310, visits: 11, segment: "regular", rank: "bronze", note: "Thích khung giờ sáng." },
  { id: "c7", name: "Vũ Minh Anh", initials: "VA", phone: "0938 555 666", birthday: "15/10/2001", handle: "@minhanh", preference: "Đính charm nhỏ.", lastVisit: "07/05/2025", totalSpend: 3280000, points: 280, visits: 9, segment: "new", rank: "bronze", note: "Khách mới trong tháng." },
  { id: "c8", name: "Bùi Minh Châu", initials: "BC", phone: "0902 777 888", birthday: "02/02/1998", handle: "@minhchau", preference: "Sơn gel đơn sắc.", lastVisit: "05/05/2025", totalSpend: 2960000, points: 230, visits: 7, segment: "new", rank: "none", note: "Chưa có ghi chú thêm." },
];

const customerHistoryById: Readonly<
  Record<string, ReadonlyArray<CustomerHistoryItem>>
> = {
  c1: [
    { id: "c1-h1", date: "16/05/2025", service: "Sơn gel đơn sắc", amount: 850000 },
    { id: "c1-h2", date: "14/05/2025", service: "Thiết kế theo mẫu", amount: 1200000 },
    { id: "c1-h3", date: "12/05/2025", service: "Sơn gel nâng cao", amount: 950000 },
    { id: "c1-h4", date: "10/05/2025", service: "Gradient + Đính đá", amount: 1100000 },
  ],
  c2: [
    { id: "c2-h1", date: "14/05/2025", service: "Thiết kế theo mẫu", amount: 1200000 },
    { id: "c2-h2", date: "02/05/2025", service: "French Nail", amount: 900000 },
  ],
  c3: [{ id: "c3-h1", date: "13/05/2025", service: "Gradient + Đính đá", amount: 1250000 }],
  c4: [{ id: "c4-h1", date: "12/05/2025", service: "French Nail", amount: 900000 }],
  c5: [{ id: "c5-h1", date: "10/05/2025", service: "Sơn gel ombre", amount: 1000000 }],
  c6: [{ id: "c6-h1", date: "08/05/2025", service: "Sơn gel đơn sắc", amount: 850000 }],
  c7: [{ id: "c7-h1", date: "07/05/2025", service: "Thêm charm", amount: 300000 }],
  c8: [{ id: "c8-h1", date: "05/05/2025", service: "Sơn gel đơn sắc", amount: 850000 }],
};

export function getCustomerHistory(customerId: string) {
  return customerHistoryById[customerId] ?? [];
}
