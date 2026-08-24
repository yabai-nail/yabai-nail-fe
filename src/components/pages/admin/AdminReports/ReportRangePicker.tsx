"use client";

import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import { monthLabel, monthToRange, type ReportRange } from "./normalize";

const fieldClassName =
  "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus-visible:ring-2 focus-visible:ring-admin-accent";

type ReportRangePickerProps = {
  readonly range: ReportRange;
  readonly months: ReadonlyArray<string>;
  readonly problem: string | null;
  readonly onRangeChange: (range: ReportRange) => void;
};

/**
 * The backend takes `from` + `to` as YYYY-MM-DD with `to` exclusive, so the
 * month shortcut is a convenience that writes into the same two fields rather
 * than a separate `period` parameter the API would not understand.
 */
export function ReportRangePicker({
  range,
  months,
  problem,
  onRangeChange,
}: ReportRangePickerProps) {
  return (
    <div className="mb-4 space-y-2 border-b border-admin-border pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex flex-col gap-1 text-sm font-semibold text-admin-ink">
          <span>Chọn nhanh theo tháng</span>
          <span className="relative">
            <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-admin-muted" />
            <select
              aria-label="Chọn nhanh khoảng báo cáo theo tháng"
              className={`${fieldClassName} w-full pl-9 pr-8 font-normal lg:w-56`}
              value=""
              onChange={(event) => {
                const month = event.target.value;
                if (month) onRangeChange(monthToRange(month));
              }}
            >
              <option value="">Chọn tháng…</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {monthLabel(month)}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-admin-ink">
          <span>Từ ngày</span>
          <input
            type="date"
            className={`${fieldClassName} font-normal`}
            value={range.from}
            onChange={(event) => onRangeChange({ ...range, from: event.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-admin-ink">
          <span>Đến ngày (không tính ngày này)</span>
          <input
            type="date"
            className={`${fieldClassName} font-normal`}
            value={range.to}
            onChange={(event) => onRangeChange({ ...range, to: event.target.value })}
          />
        </label>
      </div>

      {problem ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {problem}
        </p>
      ) : (
        <p className="text-xs text-admin-muted">
          Ngày kết thúc không được tính vào báo cáo. Khoảng tối đa 12 tháng.
        </p>
      )}
    </div>
  );
}
