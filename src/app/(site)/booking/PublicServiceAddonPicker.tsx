import { formatMoney } from "@/lib/admin-format";
import type { BranchServiceAddonGroup } from "@/service";

import { minimumSelections } from "./public-booking-addons";

interface PublicServiceAddonPickerProps {
  readonly groups: ReadonlyArray<BranchServiceAddonGroup>;
  readonly selectedOptionIds: ReadonlyArray<string>;
  readonly onToggle: (groupCode: string, optionId: string) => void;
}

export function PublicServiceAddonPicker({
  groups,
  selectedOptionIds,
  onToggle,
}: PublicServiceAddonPickerProps) {
  if (groups.length === 0) return null;
  const selected = new Set(selectedOptionIds);

  return (
    <section aria-label="Tùy chọn dịch vụ" className="mt-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Tùy chọn dịch vụ</h2>
        <p className="mt-1 text-xs text-muted">Chọn đủ các mục bắt buộc trước khi chọn giờ.</p>
      </div>
      {groups.map((group) => {
        const count = group.options.filter((option) => selected.has(option.id)).length;
        const minimum = minimumSelections(group);
        const incomplete = count < minimum;
        const groupName = group.nameVi || group.nameJa || group.code;
        return (
          <fieldset key={group.code} className="rounded-2xl border border-border bg-surface p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">
              {groupName}
              {minimum > 0 ? (
                <span className={incomplete ? "text-danger" : "text-muted"}> *</span>
              ) : null}
            </legend>
            <p className="mb-3 text-xs text-muted">
              {group.selectionMode === "SINGLE"
                ? "Chọn một"
                : `Chọn từ ${minimum} đến ${group.maxSelections}`}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.options.map((option) => {
                const active = selected.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!option.available}
                    aria-pressed={active}
                    onClick={() => onToggle(group.code, option.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                      !option.available
                        ? "cursor-not-allowed border-border text-muted opacity-50"
                        : active
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-foreground hover:border-accent"
                    }`}
                  >
                    <span>
                      <span className="block font-medium">{option.name}</span>
                      {!option.available ? (
                        <span className="mt-1 block text-xs">Hiện không khả dụng</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {formatMoney(option.price)} · {option.durationMinutes} phút
                    </span>
                  </button>
                );
              })}
            </div>
            {incomplete ? (
              <p role="alert" className="mt-3 text-xs text-danger">
                Vui lòng chọn ít nhất {minimum} tùy chọn.
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </section>
  );
}
