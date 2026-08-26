import { CalendarDaysIcon, PhoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { getCustomerSegmentLabel } from "@/lib/admin-customer";
import { formatNumber, formatVnd } from "@/lib/admin-format";
import type { MessageCustomer } from "./data";

export function CustomerSummary({ customer }: Readonly<{ customer: MessageCustomer }>) {
  const router = useRouter();
  return (
    <Card className="gap-0 rounded-none border-0 bg-admin-surface p-0 shadow-none xl:border-l xl:border-admin-border">
      <Card.Header className="px-4 pt-4"><h2 className="font-bold">Thông tin khách hàng</h2></Card.Header>
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" color="accent" className="shrink-0">
            <Avatar.Fallback>{customer.initials}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold">{customer.name}</p>
            <Chip size="sm" color="accent" variant="soft">
              <Chip.Label>{getCustomerSegmentLabel(customer.segment)}</Chip.Label>
            </Chip>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><PhoneIcon className="size-4 text-admin-muted" /><dd>{customer.phone}</dd></div>
          <div className="flex gap-2"><CalendarDaysIcon className="size-4 text-admin-muted" /><dd>{customer.birthday}</dd></div>
          <div><dt className="sr-only">Sở thích</dt><dd>{customer.preference}</dd></div>
        </dl>
        <dl className="grid grid-cols-3 gap-2 border-y border-admin-border py-3 text-center text-xs">
          <div><dt className="text-admin-muted">Chi tiêu</dt><dd className="mt-1 font-bold text-admin-accent">{formatVnd(customer.totalSpend)}</dd></div>
          <div><dt className="text-admin-muted">Lần đến</dt><dd className="mt-1 font-bold">{customer.visits}</dd></div>
          <div><dt className="text-admin-muted">Điểm</dt><dd className="mt-1 font-bold">{formatNumber(customer.points)}</dd></div>
        </dl>
        <section>
          <h3 className="font-bold">Lịch hẹn gần nhất</h3>
          <div className="mt-3 rounded-lg border border-admin-border p-3 text-sm"><p>17/05/2025 (Thứ 7)</p><p className="mt-2 text-admin-muted">14:00 - 15:30 · Sơn gel đơn sắc</p><Chip className="mt-2" size="sm" variant="soft" color="accent"><Chip.Label>Đã xác nhận</Chip.Label></Chip></div>
        </section>
        <div className="grid gap-2">
          <Button variant="primary" className="rounded-lg" onPress={() => router.push("/admin/appointments?create=1")}><PlusIcon className="size-4" />Tạo lịch hẹn</Button>
          {/* "Gửi mẫu / Báo giá" is dropped: no quote or template feature exists to open. */}
          <Button variant="outline" className="rounded-lg border-admin-border" isDisabled={!customer.phone} onPress={() => { window.location.href = `tel:${customer.phone}`; }}>Gọi điện cho khách</Button>
        </div>
      </Card.Content>
    </Card>
  );
}
