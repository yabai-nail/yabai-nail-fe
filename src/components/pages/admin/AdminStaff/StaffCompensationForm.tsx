"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import { formatVnd } from "@/lib/admin-format";
import {
  adminService,
  useStaffCompensation,
  type StaffCompensation,
} from "@/service";

export function StaffCompensationForm({ staffId }: Readonly<{ staffId: string }>) {
  const query = useStaffCompensation(staffId);
  const compensation = query.data as StaffCompensation | undefined;

  const [baseSalary, setBaseSalary] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialBase = compensation?.baseSalaryVnd ?? 0;
  const initialRate = compensation?.commissionRate ?? 60;
  const effectiveBase = baseSalary === "" ? initialBase : Number(baseSalary.replace(/\D/g, ""));
  const effectiveRate = rate === "" ? initialRate : Number(rate);
  const canSubmit = !busy && Number.isFinite(effectiveBase) && Number.isFinite(effectiveRate);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.setStaffCompensation(staffId, {
        baseSalaryVnd: effectiveBase,
        commissionRate: effectiveRate,
      });
      setBaseSalary("");
      setRate("");
      void query.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không lưu được hoa hồng.");
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
        <p className="text-xs text-admin-muted">Đang tải…</p>
      ) : query.error ? (
        <p role="alert" className="text-xs text-admin-danger">Không tải được cấu hình.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-admin-soft p-3 text-center text-xs">
          <div>
            <dt className="text-admin-muted">Lương cứng</dt>
            <dd className="mt-1 font-bold text-admin-ink">{formatVnd(initialBase)}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">Hoa hồng</dt>
            <dd className="mt-1 font-bold text-admin-accent">{initialRate}%</dd>
          </div>
        </dl>
      )}

      <div className="grid grid-cols-[1fr_5rem] gap-2 text-xs">
        <input
          inputMode="numeric"
          value={baseSalary}
          onChange={(event) => setBaseSalary(event.target.value)}
          placeholder={`Lương cứng mới (VND) — hiện tại ${formatVnd(initialBase)}`}
          className="rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          placeholder={`${initialRate}`}
          className="rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
        />
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="primary"
          className="rounded-lg"
          onPress={() => void submit()}
          isDisabled={!canSubmit}
        >
          {busy ? "Đang lưu…" : "Cập nhật hoa hồng"}
        </Button>
      </div>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    </section>
  );
}
