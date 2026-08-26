import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Chip } from "@heroui/react";
import { formatVnd } from "@/lib/admin-format";
import type { StaffMember } from "./data";

type StaffTableProps = {
  readonly staff: ReadonlyArray<StaffMember>;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Absent until a branch is chosen, since editing needs one. */
  readonly onEdit?: (id: string) => void;
};

const MISSING = "—";

function formatOptionalVnd(value: number | null): string {
  return typeof value === "number" ? formatVnd(value) : MISSING;
}

export function StaffTable({ staff, selectedId, onSelect, onEdit }: StaffTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="sr-only">Danh sách nhân viên và doanh thu</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Nhân viên</th>
            <th scope="col" className="px-3 py-3">Trạng thái</th>
            <th scope="col" className="px-3 py-3">Doanh thu</th>
            <th scope="col" className="px-3 py-3">Hoa hồng</th>
            <th scope="col" className="px-3 py-3">Nhận được</th>
            <th scope="col" className="px-3 py-3">Số đơn</th>
            <th scope="col"><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {staff.map((member) => (
            <tr key={member.id} className={selectedId === member.id ? "bg-admin-soft" : ""}>
              <td className="px-3 py-2">
                <Button variant="ghost" className="h-auto min-h-11 justify-start rounded-lg px-1" onPress={() => onSelect(member.id)}>
                  <Avatar size="sm" color="accent"><Avatar.Fallback>{member.initials}</Avatar.Fallback></Avatar>
                  <strong>{member.name}</strong>
                </Button>
              </td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={member.status === "working" ? "success" : "default"}>
                  <Chip.Label>{member.status === "working" ? "Đang làm" : "Nghỉ phép"}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2 font-medium">{formatOptionalVnd(member.revenue)}</td>
              <td className="px-3 py-2">
                {typeof member.commissionRate === "number" ? `${member.commissionRate}%` : MISSING}
              </td>
              <td className="px-3 py-2 font-bold text-admin-accent">{formatOptionalVnd(member.commissionAmount)}</td>
              <td className="px-3 py-2">{member.orders ?? MISSING}</td>
              <td className="px-3 py-2">
                {/* Was a "..." with no handler and no prop to call. One action, so it
                    names that action instead of promising a menu. */}
                {onEdit ? (
                  <Button isIconOnly size="sm" variant="ghost" aria-label={`Sửa thông tin ${member.name}`} onPress={() => onEdit(member.id)}>
                    <PencilSquareIcon className="size-4" />
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
