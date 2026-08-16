import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PencilSquareIcon,
  PhoneIcon,
  ScissorsIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { formatNumber, formatVnd } from "@/lib/admin-format";
import type { Appointment } from "./data";
import {
  appointmentStatusColor,
  appointmentStatusLabel,
} from "./status";

const segmentLabel = {
  loyal: "Khách thân thiết",
  new: "Khách mới",
  regular: "Khách lâu năm",
} as const;

export function AppointmentDetailPanel({ appointment, onEdit, onCancel, onMessage }: Readonly<{
  appointment: Appointment;
  onEdit: () => void;
  onCancel: () => void;
  onMessage: () => void;
}>) {
  const details = [
    { icon: ClockIcon, label: "Thời gian", value: `${appointment.startTime} - ${appointment.endTime} (${appointment.service.durationMinutes} phút)` },
    { icon: CalendarDaysIcon, label: "Ngày", value: appointment.date.split("-").reverse().join("/") },
    { icon: ScissorsIcon, label: "Dịch vụ", value: appointment.service.name },
    { icon: UserIcon, label: "Nhân viên", value: appointment.staff.name },
  ];

  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="border-b border-admin-border px-4 py-3"><h2 className="text-sm font-bold text-admin-ink">Chi tiết lịch hẹn</h2></Card.Header>
      <Card.Content className="space-y-5 p-4">
        <div className="flex items-center gap-3">
          <Avatar color="accent"><Avatar.Fallback>{appointment.customer.initials}</Avatar.Fallback></Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-admin-ink">{appointment.customer.name}</h3>
            <Chip size="sm" variant="soft" color="accent" className="mt-1"><Chip.Label>{segmentLabel[appointment.customer.segment]}</Chip.Label></Chip>
          </div>
        </div>

        <div className="space-y-3 border-b border-admin-border pb-4 text-sm">
          <p className="flex items-center gap-2 text-admin-ink"><PhoneIcon className="size-4 text-admin-muted" />{appointment.customer.phone}</p>
          <p className="text-xs text-admin-muted">Ngày sinh: {appointment.customer.birthday}</p>
          <p className="text-xs leading-5 text-admin-muted">{appointment.customer.preference}</p>
        </div>

        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-admin-soft p-3 text-center">
          <div><dt className="text-[0.65rem] text-admin-muted">Số lần đến</dt><dd className="mt-1 text-sm font-bold text-admin-accent">{formatNumber(appointment.customer.visits)}</dd></div>
          <div><dt className="text-[0.65rem] text-admin-muted">Tổng chi tiêu</dt><dd className="mt-1 text-sm font-bold text-admin-accent">{formatVnd(appointment.customer.totalSpend)}</dd></div>
        </dl>

        <dl className="space-y-3">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="grid grid-cols-[1rem_5rem_1fr] gap-2 text-xs">
              <Icon className="size-4 text-admin-muted" />
              <dt className="text-admin-muted">{label}</dt>
              <dd className="font-medium text-admin-ink">{value}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[1rem_5rem_1fr] gap-2 text-xs">
            <span />
            <dt className="text-admin-muted">Trạng thái</dt>
            <dd><Chip size="sm" variant="soft" color={appointmentStatusColor[appointment.status]}><Chip.Label>{appointmentStatusLabel[appointment.status]}</Chip.Label></Chip></dd>
          </div>
        </dl>

        {appointment.note ? <div className="rounded-lg border border-admin-border p-3 text-xs leading-5 text-admin-muted"><strong className="block text-admin-ink">Ghi chú</strong>{appointment.note}</div> : null}
      </Card.Content>
      <Card.Footer className="flex flex-col gap-2 border-t border-admin-border p-4">
        <Button fullWidth variant="primary" className="rounded-lg" onPress={onEdit}><PencilSquareIcon className="size-4" />Chỉnh sửa lịch hẹn</Button>
        {appointment.status !== "cancelled" ? <Button fullWidth variant="outline" className="rounded-lg border-admin-accent text-admin-accent" onPress={onCancel}><XMarkIcon className="size-4" />Hủy lịch hẹn</Button> : null}
        <Button fullWidth variant="outline" className="rounded-lg border-admin-border" onPress={onMessage}>
          <ChatBubbleLeftRightIcon className="size-4" />Nhắn tin cho khách
        </Button>
      </Card.Footer>
    </Card>
  );
}
