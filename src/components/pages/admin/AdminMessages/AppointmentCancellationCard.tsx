import { CalendarDaysIcon, MapPinIcon, SparklesIcon, UserIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useFormatter, useTranslations } from "next-intl";

import type { AppointmentCancellationNotice } from "./data";
import { SystemNoticeShell } from "./SystemNoticeShell";

export function AppointmentCancellationCard({ cancellation }: Readonly<{ cancellation: AppointmentCancellationNotice }>) {
  const t = useTranslations("admin.messages.cancellation");
  const format = useFormatter();
  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : format.dateTime(date, { dateStyle: "medium", timeStyle: "short", timeZone: cancellation.branchTimeZone });
  };
  const service = cancellation.optionNames.length
    ? `${cancellation.serviceName} · ${cancellation.optionNames.join(", ")}`
    : cancellation.serviceName;

  return <SystemNoticeShell title={t("heading")} intro={t("intro", { code: cancellation.appointmentCode })} icon={XCircleIcon} details={[
    { label: t("branch"), value: cancellation.branchName, icon: MapPinIcon },
    { label: t("address"), value: cancellation.branchAddress, icon: MapPinIcon },
    { label: t("schedule"), value: formatDateTime(cancellation.startAt), icon: CalendarDaysIcon },
    { label: t("service"), value: service, icon: SparklesIcon },
    { label: t("cancelledBy"), value: t(`actor.${cancellation.cancelledBy}`), icon: UserIcon },
    { label: t("cancelledAt"), value: formatDateTime(cancellation.cancelledAt), icon: XCircleIcon },
    ...(cancellation.reasonCode ? [{ label: t("reason"), value: cancellation.reasonCode, icon: XCircleIcon }] : []),
  ]} />;
}
