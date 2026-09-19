import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button, Tabs } from "@heroui/react";
import { useTranslations } from "next-intl";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { AppointmentDatePicker } from "./AppointmentDatePicker";
import type {
  AppointmentStatusFilter,
  AppointmentView,
} from "./data";

/** The four filterable statuses, named by the key the shared catalogue holds them under. */
const STATUS_FILTERS = [
  { value: "confirmed", key: "CONFIRMED" },
  { value: "pending", key: "PENDING" },
  { value: "completed", key: "COMPLETED" },
  { value: "cancelled", key: "CANCELLED" },
] as const;

export function AppointmentToolbar({
  dateLabel,
  selectedDate,
  today,
  view,
  status,
  onPrevious,
  onNext,
  onDateSelect,
  onToday,
  onViewChange,
  onStatusChange,
  onCreate,
}: Readonly<{
  dateLabel: string;
  selectedDate: string;
  today: string;
  view: AppointmentView;
  status: AppointmentStatusFilter;
  onPrevious: () => void;
  onNext: () => void;
  onDateSelect: (dateKey: string) => void;
  onToday: () => void;
  onViewChange: (view: AppointmentView) => void;
  onStatusChange: (status: AppointmentStatusFilter) => void;
  onCreate?: () => void;
}>) {
  const t = useTranslations("admin.appointments");
  const tStatus = useTranslations("admin.appointmentStatus");
  const statusOptions = [
    { value: "all", label: t("toolbar.allStatuses") },
    ...STATUS_FILTERS.map(({ value, key }) => ({ value, label: tStatus(key) })),
  ];

  return (
    <div className="mb-4 space-y-3 border-b border-admin-border pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="grid w-full min-w-0 flex-none grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 sm:flex sm:w-auto">
            <Button isIconOnly variant="outline" className="rounded-lg border-admin-border" aria-label={t("toolbar.previous")} onPress={onPrevious}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <AppointmentDatePicker
              value={selectedDate}
              label={dateLabel}
              today={today}
              onChange={onDateSelect}
            />
            <Button isIconOnly variant="outline" className="rounded-lg border-admin-border" aria-label={t("toolbar.next")} onPress={onNext}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <Button variant="outline" className="rounded-lg border-admin-border" onPress={onToday}>{t("toolbar.today")}</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminSelectField
            label={t("toolbar.filterLabel")}
            value={status}
            options={statusOptions}
            icon={FunnelIcon}
            onChange={(value) => onStatusChange(value as AppointmentStatusFilter)}
          />
          <Button variant="primary" className="rounded-lg" isDisabled={!onCreate} onPress={onCreate}>
            <PlusIcon className="size-4" />{t("toolbar.create")}
          </Button>
        </div>
      </div>

      <Tabs selectedKey={view} onSelectionChange={(key) => onViewChange(String(key) as AppointmentView)} variant="secondary">
        <Tabs.ListContainer className="max-w-full overflow-x-auto">
          <Tabs.List aria-label={t("toolbar.viewLabel")}>
            <Tabs.Tab id="day">{t("toolbar.day")}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="week">{t("toolbar.week")}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="month">{t("toolbar.month")}<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </div>
  );
}
