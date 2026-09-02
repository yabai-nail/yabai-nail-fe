import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PhoneIcon,
  PhotoIcon,
  PlayCircleIcon,
  ScissorsIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Button, Card, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { formatNumber, formatMoney } from "@/lib/admin-format";
import type { Appointment, AppointmentLifecycleAction } from "./data";
import {
  appointmentStatusColor,
  appointmentStatusLabel,
  splitLifecycleActions,
} from "./status";

const LIFECYCLE_LABEL: Record<AppointmentLifecycleAction, string> = {
  "check-in": "Check-in",
  "service-start": "Bắt đầu dịch vụ",
  "service-complete": "Hoàn tất dịch vụ",
  "no-show": "Không đến",
};

const LIFECYCLE_ICON: Record<AppointmentLifecycleAction, typeof CheckCircleIcon> = {
  "check-in": CheckCircleIcon,
  "service-start": PlayCircleIcon,
  "service-complete": CheckCircleIcon,
  "no-show": NoSymbolIcon,
};

const segmentLabel = {
  loyal: "Khách thân thiết",
  new: "Khách mới",
  regular: "Khách lâu năm",
} as const;

export function AppointmentDetailPanel({
  appointment,
  lifecycleActions = [],
  lifecyclePending = null,
  lifecycleError = null,
  onLifecycle,
  onEdit,
  onCancel,
  onMessage,
  onAssignStaff,
  onEditActualServices,
  onAttachPhoto,
}: Readonly<{
  appointment: Appointment;
  /** BE lifecycle transitions enabled for the current serverStatus. */
  lifecycleActions?: ReadonlyArray<AppointmentLifecycleAction>;
  /** Which transition is currently mid-request (disables the whole bar). */
  lifecyclePending?: AppointmentLifecycleAction | null;
  /** User-facing error from the most recent transition, or null. */
  lifecycleError?: string | null;
  /** Fires when the admin picks a transition; parent runs the API call. */
  onLifecycle?: (action: AppointmentLifecycleAction) => void;
  onEdit: () => void;
  onCancel: () => void;
  onMessage: () => void;
  /** Opens the assign-staff modal; hidden when omitted (local overlays). */
  onAssignStaff?: () => void;
  /** Opens the actual-services modal; hidden when omitted (local overlays). */
  onEditActualServices?: () => void;
  /** Opens the attach-photo modal; hidden when omitted (local overlays). */
  onAttachPhoto?: () => void;
}>) {
  const router = useRouter();
  // Mirrors the backend's own guard on the actual-services endpoint.
  const canEditActualServices =
    appointment.serverStatus === "IN_SERVICE" ||
    appointment.serverStatus === "AWAITING_PAYMENT";
  // A step (check-in / start / complete) leads; the "no-show" exception follows
  // it, quieter. See splitLifecycleActions for why they are not peers.
  const { steps, exceptions } = splitLifecycleActions(lifecycleActions);
  const renderLifecycleButton = (
    action: AppointmentLifecycleAction,
    variant: "outline" | "ghost",
    emphasis: string,
  ) => {
    const Icon = LIFECYCLE_ICON[action];
    return (
      <Button
        key={action}
        fullWidth
        size="sm"
        variant={variant}
        className={`rounded-lg ${emphasis}`}
        isDisabled={lifecyclePending !== null}
        onPress={() => onLifecycle?.(action)}
      >
        <Icon className="size-4" />
        {lifecyclePending === action ? "Đang xử lý…" : LIFECYCLE_LABEL[action]}
      </Button>
    );
  };
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
          <div><dt className="text-[0.65rem] text-admin-muted">Tổng chi tiêu</dt><dd className="mt-1 text-sm font-bold text-admin-accent">{formatMoney(appointment.customer.totalSpend)}</dd></div>
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
        {lifecycleActions.length > 0 && onLifecycle ? (
          /*
            `w-full` is load-bearing: HeroUI's card__footer sets
            align-items:center, so a wrapper with no width of its own shrinks to
            fit its content. That is what broke this block. The old markup put a
            `grid grid-cols-2` in here, whose two 1fr columns asked for
            149+149+8=306px, got squeezed to the 270px on offer, and handed each
            button a 131px cell — which a button never shrinks into, because it
            keeps its label on one line. "Bắt đầu dịch vụ" (149px) spilled 10px
            over the button beside it. Say the width out loud and both the
            overflow and the shrink go away.
          */
          <div className="flex w-full flex-col gap-2 border-b border-admin-border pb-3">
            <span className="text-[0.65rem] uppercase tracking-wide text-admin-muted">Vòng đời</span>
            {steps.map((action) =>
              renderLifecycleButton(action, "outline", "border-admin-accent bg-admin-soft text-admin-accent"),
            )}
            {exceptions.map((action) =>
              renderLifecycleButton(action, "ghost", "text-admin-muted"),
            )}
            {lifecycleError ? (
              <p role="alert" className="text-xs text-admin-danger">
                {lifecycleError}
              </p>
            ) : null}
          </div>
        ) : null}
        {appointment.status !== "cancelled" ? (
          <Button
            fullWidth
            variant="primary"
            className="rounded-lg"
            onPress={() => router.push(`/admin/payments?appointmentId=${encodeURIComponent(appointment.id)}`)}
          >
            <BanknotesIcon className="size-4" />
            Thanh toán
          </Button>
        ) : null}
        <Button fullWidth variant="outline" className="rounded-lg border-admin-border" onPress={onEdit}><PencilSquareIcon className="size-4" />Chỉnh sửa lịch hẹn</Button>
        {onAssignStaff && appointment.status !== "cancelled" ? (
          <Button fullWidth variant="outline" className="rounded-lg border-admin-border" onPress={onAssignStaff}>
            <ArrowsRightLeftIcon className="size-4" />Đổi nhân viên
          </Button>
        ) : null}
        {/*
          Actual services can only be edited once the service is under way: the
          backend accepts IN_SERVICE and AWAITING_PAYMENT and answers 409
          otherwise. The button used to show on every status and fail on click.
        */}
        {onEditActualServices && canEditActualServices ? (
          <Button fullWidth variant="outline" className="rounded-lg border-admin-border" onPress={onEditActualServices}>
            <WrenchScrewdriverIcon className="size-4" />Cập nhật dịch vụ thực tế
          </Button>
        ) : null}
        {onAttachPhoto && appointment.status !== "cancelled" ? (
          <Button fullWidth variant="outline" className="rounded-lg border-admin-border" onPress={onAttachPhoto}>
            <PhotoIcon className="size-4" />Đính kèm ảnh
          </Button>
        ) : null}
        {appointment.status !== "cancelled" ? <Button fullWidth variant="outline" className="rounded-lg border-admin-accent text-admin-accent" onPress={onCancel}><XMarkIcon className="size-4" />Hủy lịch hẹn</Button> : null}
        <Button fullWidth variant="outline" className="rounded-lg border-admin-border" onPress={onMessage}>
          <ChatBubbleLeftRightIcon className="size-4" />Nhắn tin cho khách
        </Button>
      </Card.Footer>
    </Card>
  );
}
