import { CalendarDaysIcon, CreditCardIcon, CurrencyYenIcon } from "@heroicons/react/24/outline";
import { useFormatter, useTranslations } from "next-intl";

import type { PaymentRecordedNotice } from "./data";
import { SystemNoticeShell } from "./SystemNoticeShell";

export function PaymentRecordedCard({ payment }: Readonly<{ payment: PaymentRecordedNotice }>) {
  const t = useTranslations("admin.messages.paymentRecorded");
  const tMethod = useTranslations("admin.paymentMethod");
  const format = useFormatter();
  const recordedAt = new Date(payment.recordedAt);
  const recordedAtLabel = Number.isNaN(recordedAt.getTime())
    ? payment.recordedAt
    : format.dateTime(recordedAt, { dateStyle: "medium", timeStyle: "short" });

  return <SystemNoticeShell title={t("heading")} intro={t("intro")} icon={CreditCardIcon} details={[
    { label: t("amount"), value: format.number(payment.amountJpy, { style: "currency", currency: "JPY", maximumFractionDigits: 0 }), icon: CurrencyYenIcon },
    { label: t("method"), value: tMethod(payment.method.toLowerCase()), icon: CreditCardIcon },
    { label: t("recordedAt"), value: recordedAtLabel, icon: CalendarDaysIcon },
  ]} />;
}
