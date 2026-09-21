import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyYenIcon,
  DocumentTextIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon,
  SparklesIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useFormatter, useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

import type { BookingConfirmation } from "./data";

type BookingConfirmationCardProps = {
  readonly booking: BookingConfirmation;
};

type DetailRow = {
  readonly label: string;
  readonly value: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly emphasise?: boolean;
};

export function BookingConfirmationCard({ booking }: BookingConfirmationCardProps) {
  const t = useTranslations("admin.messages.confirmation");
  const tMethod = useTranslations("admin.paymentMethod");
  const format = useFormatter();
  const start = new Date(booking.startAt);
  const schedule = Number.isNaN(start.getTime())
    ? booking.startAt
    : format.dateTime(start, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: booking.branchTimeZone,
      });
  const total = format.number(booking.totalJpy, {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });
  const details: ReadonlyArray<DetailRow> = [
    { label: t("customer"), value: booking.customerName, icon: UserIcon },
    {
      label: t("phone"),
      value: booking.customerPhone || t("missingPhone"),
      icon: PhoneIcon,
    },
    { label: t("schedule"), value: schedule, icon: CalendarDaysIcon },
    ...(booking.branchName ? [{ label: t("branch"), value: booking.branchName, icon: MapPinIcon }] : []),
    ...(booking.branchAddress ? [{ label: t("address"), value: booking.branchAddress, icon: MapPinIcon }] : []),
    { label: t("service"), value: booking.serviceName, icon: SparklesIcon },
    {
      label: t("options"),
      value: booking.optionNames.length ? booking.optionNames.join(", ") : t("noOptions"),
      icon: DocumentTextIcon,
    },
    { label: t("staff"), value: booking.staffName, icon: IdentificationIcon },
    {
      label: t("duration"),
      value: t("durationValue", { minutes: booking.durationMinutes }),
      icon: ClockIcon,
    },
    { label: t("total"), value: total, icon: CurrencyYenIcon, emphasise: true },
    ...(booking.expectedPaymentMethod ? [{
      label: t("expectedPaymentMethod"),
      value: tMethod(booking.expectedPaymentMethod.toLowerCase()),
      icon: CreditCardIcon,
    }] : []),
    { label: t("code"), value: booking.appointmentCode, icon: DocumentTextIcon },
  ];

  return (
    <article
      aria-label={t("accessibilityLabel", { code: booking.appointmentCode })}
      className="w-full max-w-2xl rounded-xl border border-admin-accent/25 bg-admin-surface p-4 shadow-sm"
    >
      <div className="mb-4 border-b border-admin-border pb-3">
        <p className="text-sm font-bold text-admin-accent">{t("heading")}</p>
        <p className="mt-0.5 text-xs text-admin-muted">{t("intro")}</p>
      </div>

      <dl className="grid gap-2.5 sm:grid-cols-2">
        {details.map(({ label, value, icon: Icon, emphasise }) => (
          <div className="min-w-0 rounded-lg bg-admin-canvas px-3 py-2" key={label}>
            <dt className="flex items-center gap-1.5 text-[0.68rem] font-medium text-admin-muted">
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {label}
            </dt>
            <dd
              className={`mt-1 break-words text-xs font-semibold ${emphasise ? "text-admin-accent" : "text-admin-ink"}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {booking.note.trim() ? (
        <div className="mt-3 rounded-lg border border-admin-border px-3 py-2">
          <p className="text-[0.68rem] font-medium text-admin-muted">{t("note")}</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-admin-ink">
            {booking.note}
          </p>
        </div>
      ) : null}
    </article>
  );
}
