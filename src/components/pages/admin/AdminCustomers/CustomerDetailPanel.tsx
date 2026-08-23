import { CalendarDaysIcon, ChatBubbleLeftRightIcon, PencilSquareIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { getCustomerSegmentLabel } from "@/lib/admin-customer";
import { formatNumber, formatVnd } from "@/lib/admin-format";
import { getCustomerHistory, type Customer } from "./data";

export function CustomerDetailPanel({ customer }: Readonly<{ customer: Customer }>) {
  const customerHistory = getCustomerHistory(customer.id);

  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row items-center justify-between px-4 pt-4">
        <h2 className="font-bold">Thông tin khách hàng</h2>
        <Button isIconOnly size="sm" variant="ghost" aria-label={`Chỉnh sửa ${customer.name}`}><PencilSquareIcon className="size-4" /></Button>
      </Card.Header>
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" color="accent"><Avatar.Fallback>{customer.initials}</Avatar.Fallback></Avatar>
          <div><p className="font-bold">{customer.name}</p><Chip size="sm" color="accent" variant="soft"><Chip.Label>{getCustomerSegmentLabel(customer.segment)}</Chip.Label></Chip></div>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><PhoneIcon className="size-4 shrink-0 text-admin-muted" /><dd>{customer.phone}</dd></div>
          <div className="flex gap-2"><CalendarDaysIcon className="size-4 shrink-0 text-admin-muted" /><dd>{customer.birthday}</dd></div>
          <div><dt className="sr-only">Mạng xã hội</dt><dd className="text-admin-muted">{customer.handle}</dd></div>
          <div><dt className="sr-only">Sở thích</dt><dd>{customer.preference}</dd></div>
        </dl>
        <dl className="grid grid-cols-2 gap-3 border-y border-admin-border py-3 text-center text-xs sm:grid-cols-4 xl:grid-cols-2">
          <div><dt className="text-admin-muted">Tổng chi tiêu</dt><dd className="mt-1 font-bold text-admin-accent">{formatVnd(customer.totalSpend)}</dd></div>
          <div><dt className="text-admin-muted">Lần đến</dt><dd className="mt-1 font-bold">{customer.visits}</dd></div>
          <div><dt className="text-admin-muted">Điểm</dt><dd className="mt-1 font-bold">{formatNumber(customer.points)}</dd></div>
          <div><dt className="text-admin-muted">Hạng</dt><dd className="mt-1 font-bold capitalize">{customer.rank}</dd></div>
        </dl>
        <section aria-labelledby="customer-history-heading">
          <div className="flex items-center justify-between"><h3 id="customer-history-heading" className="text-sm font-bold">Lịch sử dịch vụ gần đây</h3><Button size="sm" variant="ghost" className="text-admin-accent">Xem tất cả</Button></div>
          <ul className="mt-2 space-y-2 text-xs">{customerHistory.map((item) => <li key={item.id} className="grid grid-cols-[5rem_1fr_auto] gap-2"><span className="text-admin-muted">{item.date}</span><span>{item.service}</span><strong>{formatVnd(item.amount)}</strong></li>)}</ul>
        </section>
        <section aria-labelledby="customer-note-heading" className="border-t border-admin-border pt-3"><h3 id="customer-note-heading" className="text-sm font-bold">Ghi chú của khách hàng</h3><p className="mt-2 text-xs leading-5 text-admin-muted">{customer.note}</p></section>
        <div className="grid gap-2"><Button variant="primary" className="rounded-lg"><PencilSquareIcon className="size-4" />Chỉnh sửa thông tin</Button><Button variant="outline" className="rounded-lg border-admin-accent/30 text-admin-accent"><ChatBubbleLeftRightIcon className="size-4" />Nhắn tin cho khách</Button></div>
      </Card.Content>
    </Card>
  );
}
