import { Card } from "@heroui/react";
import { useTranslations } from "next-intl";

// The "lịch sử thay đổi tỷ lệ" card that used to sit under these notes ran on a
// fixture: no operation in the registry returns a history of commission-rate
// changes, so it was removed rather than shown with invented rows.
export function SettingsAside() {
  const t = useTranslations("admin.settings");
  return (
    <div className="space-y-4">
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4"><h2 className="font-bold">{t("aside.heading")}</h2></Card.Header>
        <Card.Content className="p-4 text-xs leading-5 text-admin-muted">
          <ul className="list-disc space-y-2 pl-4">
            <li>{t("aside.note1")}</li>
            <li>{t("aside.note2")}</li>
            <li>{t("aside.note3")}</li>
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}
