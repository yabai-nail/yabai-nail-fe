"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { adminService, useAdminBranchSettings } from "@/service";

type BookingConfig = {
  windowDays: number;
  cancellationCutoffHours: number;
  slotIntervalMinutes: number;
};

const DEFAULTS: BookingConfig = {
  windowDays: 60,
  cancellationCutoffHours: 2,
  slotIntervalMinutes: 30,
};

function readNumber(source: Readonly<Record<string, unknown>> | undefined, key: string, fallback: number): number {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// Small write surface for the branch-scoped booking policy. Scope is 3
// fields the platform doc calls out: window, cancellation cutoff, slot
// interval. Everything else stays in the placeholder tabs until a caller
// asks for it.
export function BranchSettingsForm({ branchId }: Readonly<{ branchId: string }>) {
  const query = useAdminBranchSettings(branchId);
  const settings = query.data;
  const remote: BookingConfig = {
    windowDays: readNumber(settings?.booking, "bookingWindowDays", DEFAULTS.windowDays),
    cancellationCutoffHours: Math.round(
      readNumber(settings?.booking, "cancellationCutoffMinutes", DEFAULTS.cancellationCutoffHours * 60) / 60,
    ),
    slotIntervalMinutes: readNumber(settings?.booking, "slotIntervalMinutes", DEFAULTS.slotIntervalMinutes),
  };

  // React 19 pattern: adjust local state on prop change during render,
  // guarded by the remote version so we don't clobber the user's in-flight
  // edits every time SWR revalidates the same version.
  const [draft, setDraft] = useState<BookingConfig>(remote);
  const [lastVersion, setLastVersion] = useState<number | undefined>(settings?.version);
  if (settings?.version !== lastVersion) {
    setLastVersion(settings?.version);
    setDraft(remote);
  }
  const dirty =
    draft.windowDays !== remote.windowDays
    || draft.cancellationCutoffHours !== remote.cancellationCutoffHours
    || draft.slotIntervalMinutes !== remote.slotIntervalMinutes;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!dirty) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updateBranchSettings(
        branchId,
        {
          // Field names the backend consumes. It reads booking.bookingWindowDays
          // and booking.cancellationCutoffMinutes; the form used to write
          // windowDays and cancellationCutoffHours, which were stored verbatim
          // and never read, so the saved value showed on screen while the salon
          // kept running on the old one.
          booking: {
            bookingWindowDays: draft.windowDays,
            cancellationCutoffMinutes: draft.cancellationCutoffHours * 60,
            slotIntervalMinutes: draft.slotIntervalMinutes,
          },
        },
        settings?.version,
      );
      void query.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không lưu được cài đặt đặt lịch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Header className="border-b border-admin-border px-5 py-3">
        <h2 className="font-bold text-admin-ink">Cài đặt đặt lịch chi nhánh</h2>
      </Card.Header>
      <Card.Content className="grid gap-3 p-5 text-sm">
        {query.isLoading ? (
          <p className="text-xs text-admin-muted">Đang tải cài đặt…</p>
        ) : query.error ? (
          <p role="alert" className="text-xs text-admin-danger">Không tải được — hiển thị giá trị mặc định.</p>
        ) : null}

        <label className="grid grid-cols-[1fr_8rem] items-center gap-3">
          <span className="text-admin-ink">Cho phép đặt trước tối đa (ngày)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={draft.windowDays}
            onChange={(event) => setDraft((current) => ({ ...current, windowDays: Number(event.target.value) }))}
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
          />
        </label>

        <label className="grid grid-cols-[1fr_8rem] items-center gap-3">
          <span className="text-admin-ink">Hạn huỷ trước lịch (giờ)</span>
          <input
            type="number"
            min={0}
            max={168}
            value={draft.cancellationCutoffHours}
            onChange={(event) => setDraft((current) => ({ ...current, cancellationCutoffHours: Number(event.target.value) }))}
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
          />
        </label>

        <label className="grid grid-cols-[1fr_8rem] items-center gap-3">
          <span className="text-admin-ink">Bước thời gian slot (phút)</span>
          <input
            type="number"
            min={5}
            max={120}
            step={5}
            value={draft.slotIntervalMinutes}
            onChange={(event) => setDraft((current) => ({ ...current, slotIntervalMinutes: Number(event.target.value) }))}
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
          />
        </label>

        {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
      </Card.Content>
      <Card.Footer className="flex justify-end border-t border-admin-border px-5 py-3">
        <Button
          variant="primary"
          className="rounded-lg"
          onPress={() => void save()}
          isDisabled={!dirty || busy}
        >
          {busy ? "Đang lưu…" : "Lưu cài đặt"}
        </Button>
      </Card.Footer>
    </Card>
  );
}
