"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { useState } from "react";
import { formatMoney } from "@/lib/admin-format";
import { todayAtSalon } from "@/lib/salon-date";
import {
  adminService,
  useStaffCompensation,
  type StaffCompensation,
} from "@/service";

export function StaffCompensationForm({ staffId }: Readonly<{ staffId: string }>) {
  const t = useTranslations("admin.staff");
  const query = useStaffCompensation(staffId);
  const compensation = query.data as StaffCompensation | undefined;

  const [baseSalary, setBaseSalary] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  // The backend requires effectiveFrom and rejects the request outright without
  // it. The form never had this field, so saving a commission rate failed with
  // 422 every time and no staff member could ever be configured.
  const [effectiveFrom, setEffectiveFrom] = useState<string>(() => todayAtSalon());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialBase = compensation?.baseSalary ?? 0;
  const initialRate = compensation?.commissionRate ?? 60;
  const effectiveBase = baseSalary === "" ? initialBase : Number(baseSalary.replace(/\D/g, ""));
  const effectiveRate = rate === "" ? initialRate : Number(rate);
  const canSubmit =
    !busy &&
    Number.isFinite(effectiveBase) &&
    Number.isFinite(effectiveRate) &&
    effectiveFrom !== "";

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.setStaffCompensation(
        staffId,
        {
          baseSalary: effectiveBase,
          commissionRate: effectiveRate,
          effectiveFrom,
        },
        // The endpoint is version-checked; without If-Match it answers
        // "If-Match bat buoc." An unconfigured staff member reads back as
        // version 0, which is the correct first-write value.
        compensation?.version ?? 0,
      );
      setBaseSalary("");
      setRate("");
      void query.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("compensation.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="staff-compensation-heading" className="space-y-3 border-t border-admin-border pt-4">
      <h3 id="staff-compensation-heading" className="text-sm font-bold text-admin-ink">
        Cấu hình hoa hồng
      </h3>

      {query.isLoading ? (
        <p className="text-xs text-admin-muted">{t("compensation.loading")}</p>
      ) : query.error ? (
        <p role="alert" className="text-xs text-admin-danger">{t("compensation.loadFailed")}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-admin-soft p-3 text-center text-xs">
          <div>
            <dt className="text-admin-muted">{t("compensation.baseSalary")}</dt>
            <dd className="mt-1 font-bold text-admin-ink">{formatMoney(initialBase)}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("compensation.commission")}</dt>
            <dd className="mt-1 font-bold text-admin-accent">{initialRate}%</dd>
          </div>
        </dl>
      )}

      <div className="grid grid-cols-[1fr_5rem] gap-2 text-xs">
        <label htmlFor={`${staffId}-base-salary`} className="flex flex-col gap-1">
          <span className="font-semibold text-admin-ink">{t("compensation.newBaseSalary")}</span>
          <input
            id={`${staffId}-base-salary`}
            inputMode="numeric"
            value={baseSalary}
            onChange={(event) => setBaseSalary(event.target.value)}
            placeholder={formatMoney(initialBase)}
            className="rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
          />
        </label>
        <label htmlFor={`${staffId}-commission-rate`} className="flex flex-col gap-1">
          <span className="font-semibold text-admin-ink">{t("compensation.commissionPercent")}</span>
          <input
            id={`${staffId}-commission-rate`}
            type="number"
            min={0}
            max={100}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            placeholder={`${initialRate}`}
            className="rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
          />
        </label>
      </div>
      <label htmlFor={`${staffId}-effective-from`} className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-admin-ink">{t("compensation.effectiveFrom")}</span>
        <input
          id={`${staffId}-effective-from`}
          type="date"
          value={effectiveFrom}
          onChange={(event) => setEffectiveFrom(event.target.value)}
          className="rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
        />
        <span className="text-admin-muted">
          Phải sau ngày hiệu lực của cấu hình hiện tại. Hoa hồng đã chốt trước ngày này giữ nguyên.
        </span>
      </label>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="primary"
          className="rounded-lg"
          onPress={() => void submit()}
          isDisabled={!canSubmit}
        >
          {busy ? t("compensation.saving") : t("compensation.submit")}
        </Button>
      </div>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    </section>
  );
}
