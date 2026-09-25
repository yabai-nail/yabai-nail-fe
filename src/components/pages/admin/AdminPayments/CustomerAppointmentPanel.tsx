import {
  CalendarDaysIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import { appointmentStatusColor, appointmentStatusLabel, normalizeAppointmentStatus } from "../AdminAppointments/status";
import type { CheckoutInvoice } from "./data";

export function CustomerAppointmentPanel({ invoice, appointmentStatus }: Readonly<{
  invoice: CheckoutInvoice;
  appointmentStatus: string;
}>) {
  const t = useTranslations("admin.payments");
  const tStatus = useTranslations("admin.appointmentStatus");
  const tSegment = useTranslations("admin.appointments.segment");
  const normalizedStatus = normalizeAppointmentStatus(appointmentStatus);
  return (
      <Card className="h-fit gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex flex-row items-center justify-between border-b border-admin-border px-4 py-3">
          <h2 className="text-sm font-bold text-admin-ink">{t("customer.heading")}</h2>
          {/* A "..." with no menu behind it. Customer actions live on the customer
              screen; this only looked like an affordance. */}
        </Card.Header>
        <Card.Content className="space-y-5 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-admin-soft font-bold text-admin-accent" aria-hidden="true">{invoice.customer.initials}</span>
            <div className="min-w-0">
              <p className="truncate font-bold text-admin-ink">{invoice.customer.name}</p>
              {invoice.customer.segment ? <Chip size="sm" variant="soft" color="accent"><Chip.Label>{tSegment(invoice.customer.segment)}</Chip.Label></Chip> : null}
            </div>
          </div>
          <dl className="space-y-2 text-xs text-admin-muted">
            <InfoRow icon={PhoneIcon} label={t("customer.phone")} value={invoice.customer.phone} />
            <InfoRow icon={CalendarDaysIcon} label={t("customer.birthday")} value={invoice.customer.birthday} />
            <InfoRow icon={UserIcon} label={t("customer.visits")} value={t("customer.visitsValue", { count: invoice.customer.visits })} />
            <div className="flex justify-between gap-3 border-t border-admin-border pt-3"><dt>{t("customer.totalSpend")}</dt><dd className="font-semibold text-admin-ink">{formatMoney(invoice.customer.totalSpend)}</dd></div>
          </dl>
          <div className="border-t border-admin-border pt-4">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-admin-ink">{t("appointment.heading")}</h3><Chip size="sm" variant="soft" color={appointmentStatusColor[normalizedStatus]}><Chip.Label>{appointmentStatusLabel(normalizedStatus, tStatus)}</Chip.Label></Chip></div>
            <dl className="space-y-3 text-xs text-admin-muted">
              <InfoRow icon={CalendarDaysIcon} label={t("appointment.date")} value={invoice.appointment.date} />
              <InfoRow icon={ClockIcon} label={t("appointment.time")} value={invoice.appointment.time} />
              <InfoRow icon={UserIcon} label={t("appointment.staff")} value={invoice.appointment.staffName} />
            </dl>
            <p className="mt-4 rounded-lg bg-admin-soft p-3 text-xs leading-5 text-admin-muted">{invoice.appointment.note}</p>
          </div>
        </Card.Content>
      </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: Readonly<{ icon: typeof PhoneIcon; label: string; value: string }>) {
  return <div className="grid grid-cols-[1rem_5rem_minmax(0,1fr)] items-start gap-2"><Icon aria-hidden="true" className="size-4" /><dt>{label}</dt><dd className="break-words font-medium text-admin-ink">{value}</dd></div>;
}
