import { Card, Chip } from "@heroui/react";
import { formatVnd } from "@/lib/admin-format";
import { recentOrders } from "./data";

export function RecentOrdersTable() {
  return (
    <Card className="mt-4 min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex items-center justify-between px-4 pt-4">
        <h2 className="font-bold">Đơn hàng gần đây của nhân viên</h2>
        <span className="text-xs font-semibold text-admin-accent">Xem tất cả</span>
      </Card.Header>
      <Card.Content className="min-w-0 overflow-x-auto p-0 pt-2">
        <table className="w-full min-w-[650px] text-left text-sm">
          <caption className="sr-only">Đơn hàng gần đây</caption>
          <thead className="border-b border-admin-border text-xs text-admin-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Thời gian</th>
              <th scope="col" className="px-3 py-3">Khách hàng</th>
              <th scope="col" className="px-3 py-3">Dịch vụ</th>
              <th scope="col" className="px-3 py-3">Tổng tiền</th>
              <th scope="col" className="px-3 py-3">Hoa hồng</th>
              <th scope="col" className="px-3 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">{order.time}</td>
                <td className="px-3 py-3 font-semibold">{order.customer}</td>
                <td className="px-3 py-3">{order.service}</td>
                <td className="px-3 py-3">{formatVnd(order.total)}</td>
                <td className="px-3 py-3">{formatVnd(order.commission)}</td>
                <td className="px-3 py-3">
                  <Chip size="sm" variant="soft" color={order.status === "paid" ? "success" : "warning"}>
                    <Chip.Label>{order.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}</Chip.Label>
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card.Content>
    </Card>
  );
}
