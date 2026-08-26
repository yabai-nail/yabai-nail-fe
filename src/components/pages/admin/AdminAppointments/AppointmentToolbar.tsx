import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button, Tabs } from "@heroui/react";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import type {
  AppointmentStatusFilter,
  AppointmentView,
} from "./data";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
] as const;

export function AppointmentToolbar({
  dateLabel,
  view,
  status,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onStatusChange,
  onCreate,
}: Readonly<{
  dateLabel: string;
  view: AppointmentView;
  status: AppointmentStatusFilter;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: AppointmentView) => void;
  onStatusChange: (status: AppointmentStatusFilter) => void;
  onCreate: () => void;
}>) {
  return (
    <div className="mb-4 space-y-3 border-b border-admin-border pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="grid w-full min-w-0 flex-none grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 sm:flex sm:w-auto">
            <Button isIconOnly variant="outline" className="rounded-lg border-admin-border" aria-label="Khoảng thời gian trước" onPress={onPrevious}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <div className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-ink">
              <CalendarDaysIcon className="size-4 shrink-0 text-admin-muted" />
              <span className="truncate sm:hidden">{dateLabel.split(" (")[0]}</span>
              <span className="hidden truncate sm:inline">{dateLabel}</span>
            </div>
            <Button isIconOnly variant="outline" className="rounded-lg border-admin-border" aria-label="Khoảng thời gian tiếp theo" onPress={onNext}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <Button variant="outline" className="rounded-lg border-admin-border" onPress={onToday}>Hôm nay</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminSelectField
            label="Lọc trạng thái lịch hẹn"
            value={status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(value) => onStatusChange(value as AppointmentStatusFilter)}
          />
          <Button variant="primary" className="rounded-lg" onPress={onCreate}>
            <PlusIcon className="size-4" />Thêm lịch hẹn
          </Button>
        </div>
      </div>

      <Tabs selectedKey={view} onSelectionChange={(key) => onViewChange(String(key) as AppointmentView)} variant="secondary">
        <Tabs.ListContainer className="max-w-full overflow-x-auto">
          <Tabs.List aria-label="Kiểu hiển thị lịch">
            <Tabs.Tab id="day">Ngày<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="week">Tuần<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="month">Tháng<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </div>
  );
}
