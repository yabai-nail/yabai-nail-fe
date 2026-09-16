"use client";

import { useTranslations } from "next-intl";
import { Button, Card } from "@heroui/react";
import { useState } from "react";
import {
  adminService,
  useAdminBranchSettings,
  useAdminPermission,
  type AdminSalonAmenity,
  type AdminSalonPaymentMethod,
  type AdminSalonSettings,
} from "@/service";
import { notifySuccess } from "@/lib/app-toast";

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

const DEFAULT_SALON: AdminSalonSettings = {
  openingHours: { openTime: "10:00", closeTime: "20:00", lastBookingTime: "19:00" },
  amenities: [],
  paymentMethods: ["CASH"],
};

const AMENITIES: ReadonlyArray<AdminSalonAmenity> = ["WIFI", "REFRESHMENTS", "PHONE_CHARGING", "LUGGAGE_STORAGE"];
const PAYMENT_METHODS: ReadonlyArray<AdminSalonPaymentMethod> = ["CASH", "PAYPAY", "VISA", "MASTERCARD"];

function readNumber(source: Readonly<Record<string, unknown>> | undefined, key: string, fallback: number): number {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// Small write surface for the branch-scoped booking policy. Scope is 3
// fields the platform doc calls out: window, cancellation cutoff, slot
// interval. Everything else stays in the placeholder tabs until a caller
// asks for it.
export function BranchSettingsForm({ branchId }: Readonly<{ branchId: string }>) {
  const t = useTranslations("admin.settings");
  const tc = useTranslations("admin.common");
  const query = useAdminBranchSettings(branchId);
  const canWrite = useAdminPermission("branch.settings.write.branch");
  const canWriteSalon = useAdminPermission("branch.write.all");
  const settings = query.data;
  const remote: BookingConfig = {
    windowDays: readNumber(settings?.booking, "bookingWindowDays", DEFAULTS.windowDays),
    cancellationCutoffHours: Math.round(
      readNumber(settings?.booking, "cancellationCutoffMinutes", DEFAULTS.cancellationCutoffHours * 60) / 60,
    ),
    slotIntervalMinutes: readNumber(settings?.booking, "slotIntervalMinutes", DEFAULTS.slotIntervalMinutes),
  };
  const remoteSalon = settings?.salon ?? DEFAULT_SALON;

  // React 19 pattern: adjust local state on prop change during render,
  // guarded by the remote version so we don't clobber the user's in-flight
  // edits every time SWR revalidates the same version.
  const [draft, setDraft] = useState<BookingConfig>(remote);
  const [salonDraft, setSalonDraft] = useState<AdminSalonSettings>(remoteSalon);
  const [lastVersion, setLastVersion] = useState<number | undefined>(settings?.version);
  if (settings?.version !== lastVersion) {
    setLastVersion(settings?.version);
    setDraft(remote);
    setSalonDraft(remoteSalon);
  }
  const dirty =
    draft.windowDays !== remote.windowDays
    || draft.cancellationCutoffHours !== remote.cancellationCutoffHours
    || draft.slotIntervalMinutes !== remote.slotIntervalMinutes;
  const salonDirty = JSON.stringify(salonDraft) !== JSON.stringify(remoteSalon);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if ((!dirty || !canWrite) && (!salonDirty || !canWriteSalon)) return;
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
          ...(dirty && canWrite ? { booking: {
            bookingWindowDays: draft.windowDays,
            cancellationCutoffMinutes: draft.cancellationCutoffHours * 60,
            slotIntervalMinutes: draft.slotIntervalMinutes,
          } } : {}),
          ...(salonDirty && canWriteSalon ? { salon: salonDraft } : {}),
        },
        settings?.version,
      );
      notifySuccess(tc("settingsSaved"));
      void query.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("booking.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Header className="border-b border-admin-border px-5 py-3">
        <h2 className="font-bold text-admin-ink">{t("booking.heading")}</h2>
      </Card.Header>
      <Card.Content className="grid gap-3 p-5 text-sm">
        {query.isLoading ? (
          <p className="text-xs text-admin-muted">{t("booking.loading")}</p>
        ) : query.error ? (
          <p role="alert" className="text-xs text-admin-danger">{t("booking.loadFailed")}</p>
        ) : null}

        <label className="grid grid-cols-[1fr_8rem] items-center gap-3">
          <span className="text-admin-ink">{t("booking.leadDays")}</span>
          <input
            disabled={!canWrite}
            type="number"
            min={1}
            max={365}
            value={draft.windowDays}
            onChange={(event) => setDraft((current) => ({ ...current, windowDays: Number(event.target.value) }))}
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
          />
        </label>

        <fieldset className="mt-2 grid gap-3 border-t border-admin-border pt-4">
          <legend className="px-1 text-sm font-bold text-admin-ink">{t("salon.heading")}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["openTime", "closeTime", "lastBookingTime"] as const).map((field) => (
              <label key={field} className="grid gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t(`salon.${field}`)}</span>
                <input
                  disabled={!canWriteSalon}
                  type="time"
                  value={salonDraft.openingHours[field]}
                  onChange={(event) => setSalonDraft((current) => ({
                    ...current,
                    openingHours: { ...current.openingHours, [field]: event.target.value },
                  }))}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
            ))}
          </div>
          <OptionGroup
            label={t("salon.amenities")}
            options={AMENITIES}
            selected={salonDraft.amenities}
            disabled={!canWriteSalon}
            labelFor={(value) => t(`salon.amenity.${value}`)}
            onChange={(amenities) => setSalonDraft((current) => ({ ...current, amenities }))}
          />
          <OptionGroup
            label={t("salon.paymentMethods")}
            options={PAYMENT_METHODS}
            selected={salonDraft.paymentMethods}
            disabled={!canWriteSalon}
            labelFor={(value) => t(`salon.payment.${value}`)}
            onChange={(paymentMethods) => setSalonDraft((current) => ({ ...current, paymentMethods }))}
          />
          {!canWriteSalon ? <p className="text-xs text-admin-muted">{t("salon.ownerOnly")}</p> : null}
        </fieldset>

        <label className="grid grid-cols-[1fr_8rem] items-center gap-3">
          <span className="text-admin-ink">{t("booking.cancelHours")}</span>
          <input
            disabled={!canWrite}
            type="number"
            min={0}
            max={168}
            value={draft.cancellationCutoffHours}
            onChange={(event) => setDraft((current) => ({ ...current, cancellationCutoffHours: Number(event.target.value) }))}
            className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
          />
        </label>

        <label className="grid grid-cols-[1fr_8rem] items-center gap-3">
          <span className="text-admin-ink">{t("booking.slotMinutes")}</span>
          <input
            disabled={!canWrite}
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
          isDisabled={busy || ((!canWrite || !dirty) && (!canWriteSalon || !salonDirty))}
        >
          {busy ? t("booking.saving") : t("booking.save")}
        </Button>
      </Card.Footer>
    </Card>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  selected,
  disabled,
  labelFor,
  onChange,
}: Readonly<{
  label: string;
  options: ReadonlyArray<T>;
  selected: ReadonlyArray<T>;
  disabled: boolean;
  labelFor: (value: T) => string;
  onChange: (values: ReadonlyArray<T>) => void;
}>) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-xs font-semibold text-admin-ink">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((value) => (
          <label key={value} className="flex min-h-10 items-center gap-2 rounded-lg border border-admin-border px-3">
            <input
              type="checkbox"
              className="accent-admin-accent"
              disabled={disabled}
              checked={selected.includes(value)}
              onChange={() => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])}
            />
            <span>{labelFor(value)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
