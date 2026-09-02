import { PhoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Avatar, Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { MessageCustomer } from "./data";

export function CustomerSummary({ customer }: Readonly<{ customer: MessageCustomer }>) {
  const t = useTranslations("admin.messages");
  const router = useRouter();
  return (
    <Card className="gap-0 rounded-none border-0 bg-admin-surface p-0 shadow-none xl:border-l xl:border-admin-border">
      <Card.Header className="px-4 pt-4"><h2 className="font-bold">{t("customerInfo")}</h2></Card.Header>
      <Card.Content className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" color="accent" className="shrink-0">
            <Avatar.Fallback>{customer.initials}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold">{customer.name}</p>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><PhoneIcon className="size-4 text-admin-muted" /><dd>{customer.phone}</dd></div>
        </dl>
        {/* "Lịch hẹn gần nhất" was a fixed date in 2025 with a fixed service and a
            "Đã xác nhận" chip, shown for whichever customer was selected.
            MessageCustomer carries no appointment at all, so there was nothing to
            render it from — the panel links to the appointment screen instead. */}
        <div className="grid gap-2">
          <Button variant="primary" className="rounded-lg" onPress={() => router.push("/admin/appointments?create=1")}><PlusIcon className="size-4" />{t("createAppointment")}</Button>
          {/* "Gửi mẫu / Báo giá" is dropped: no quote or template feature exists to open. */}
          <Button variant="outline" className="rounded-lg border-admin-border" isDisabled={!customer.phone} onPress={() => { window.location.href = `tel:${customer.phone}`; }}>{t("callCustomer")}</Button>
        </div>
      </Card.Content>
    </Card>
  );
}
