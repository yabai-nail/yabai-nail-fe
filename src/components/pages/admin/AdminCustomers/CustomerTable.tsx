import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { formatNumber, formatVnd } from "@/lib/admin-format";
import type { Customer, CustomerRank } from "./data";

const rankLabel: Record<CustomerRank, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  none: "—",
};

export function CustomerTable({ customers, selectedId, onSelect }: Readonly<{
  customers: ReadonlyArray<Customer>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">Danh sách khách hàng</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Khách hàng</th>
            <th scope="col" className="px-3 py-3 font-semibold">SĐT</th>
            <th scope="col" className="px-3 py-3 font-semibold">Lần đến gần nhất</th>
            <th scope="col" className="px-3 py-3 font-semibold">Tổng chi tiêu</th>
            <th scope="col" className="px-3 py-3 font-semibold">Điểm tích lũy</th>
            <th scope="col" className="px-3 py-3 font-semibold">Hạng</th>
            <th scope="col" className="px-3 py-3"><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {customers.map((customer) => (
            <tr key={customer.id} className={selectedId === customer.id ? "bg-admin-soft" : "bg-admin-surface"}>
              <td className="px-3 py-2">
                <Button variant="ghost" className="h-auto min-h-11 w-full justify-start rounded-lg px-1" onPress={() => onSelect(customer.id)}>
                  <Avatar size="sm" color="accent"><Avatar.Fallback>{customer.initials}</Avatar.Fallback></Avatar>
                  <span className="text-left">
                    <span className="block font-semibold text-admin-ink">{customer.name}</span>
                    <span className="mt-0.5 block text-xs text-admin-accent">{customer.segment === "loyal" ? "Khách thân thiết" : customer.segment === "new" ? "Khách mới" : "Khách lâu năm"}</span>
                  </span>
                </Button>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{customer.phone}</td>
              <td className="px-3 py-2 whitespace-nowrap">{customer.lastVisit}</td>
              <td className="px-3 py-2 whitespace-nowrap font-medium">{formatVnd(customer.totalSpend)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatNumber(customer.points)} pt</td>
              <td className="px-3 py-2"><Chip size="sm" variant="soft" color={customer.rank === "gold" ? "warning" : "default"}><Chip.Label>{rankLabel[customer.rank]}</Chip.Label></Chip></td>
              <td className="px-3 py-2"><Button isIconOnly size="sm" variant="ghost" aria-label={`Mở thao tác cho ${customer.name}`}><EllipsisVerticalIcon className="size-4" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 ? <p role="status" className="px-4 py-12 text-center text-sm text-admin-muted">Không tìm thấy khách hàng phù hợp.</p> : null}
    </div>
  );
}
