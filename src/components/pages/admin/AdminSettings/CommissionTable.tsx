import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { calculateCommission } from "@/lib/admin-commission";
import { formatVnd } from "@/lib/admin-format";
import type { CommissionPolicy } from "./data";

export function CommissionTable({ policies }: Readonly<{ policies: ReadonlyArray<CommissionPolicy> }>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">Danh sách nhân viên và tỷ lệ hoa hồng</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Nhân viên</th>
            <th scope="col" className="px-3 py-3">Trạng thái</th>
            <th scope="col" className="px-3 py-3">Tỷ lệ hoa hồng</th>
            <th scope="col" className="px-3 py-3">Áp dụng từ ngày</th>
            <th scope="col" className="px-3 py-3">Doanh thu cá nhân</th>
            <th scope="col" className="px-3 py-3">Tiền nhân viên nhận</th>
            <th scope="col" className="px-3 py-3">Phần tiệm nhận</th>
            <th scope="col" className="px-3 py-3">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {policies.map((policy) => {
            const payout = calculateCommission(policy.personalRevenue, policy.rate);

            return (
              <tr key={policy.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" color="accent"><Avatar.Fallback>{policy.initials}</Avatar.Fallback></Avatar>
                    <strong>{policy.name}</strong>
                    {policy.role ? <Chip size="sm" variant="soft" color="accent"><Chip.Label>Quản lý</Chip.Label></Chip> : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Chip size="sm" variant="soft" color={policy.status === "working" ? "success" : "default"}>
                    <Chip.Label>{policy.status === "working" ? "Đang làm" : "Nghỉ phép"}</Chip.Label>
                  </Chip>
                </td>
                <td className="px-3 py-3">
                  <strong className="text-lg text-admin-accent">{policy.rate}%</strong>
                  {policy.previousRate ? <span className="mt-1 block text-xs text-admin-success">↑ {policy.rate - policy.previousRate}% so với trước</span> : null}
                </td>
                <td className="px-3 py-3">{policy.effectiveFrom}</td>
                <td className="px-3 py-3 font-semibold">{formatVnd(policy.personalRevenue)}</td>
                <td className="px-3 py-3 font-bold text-admin-accent">{formatVnd(payout)}</td>
                <td className="px-3 py-3">{formatVnd(policy.personalRevenue - payout)}</td>
                <td className="px-3 py-3">
                  <Button size="sm" variant="outline" className="rounded-lg border-admin-accent/30 text-admin-accent"><PencilSquareIcon className="size-4" />Sửa</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
