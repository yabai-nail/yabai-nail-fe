"use client";

import { useTranslations } from "next-intl";

import { AdminPriceTierPicker } from "@/components/blocks/admin/AdminPriceTierPicker";
import { formatMoney } from "@/lib/admin-format";
import type { AdminPriceTier } from "@/service";
import type { ServicePriceMode } from "./service-price";

const inputClass = "min-h-10 rounded-lg border bg-admin-surface px-3 text-admin-ink";
const modes: ReadonlyArray<ServicePriceMode> = ["tier", "custom"];

/** Whether the tier list can be offered: `hidden` means this admin may not read price tiers. */
export type TierListStatus = "ready" | "loading" | "failed" | "hidden";

/**
 * The price of a service: either one of the shared price tiers (Mức giá), whose amount the
 * service then follows, or a price typed on the service itself. Same two-way choice as a nail
 * design's price, so both screens read alike.
 */
export function ServicePriceFields({
  tiers,
  tierStatus,
  canLink,
  isLinked,
  mode,
  tierId,
  price,
  priceInvalid,
  tierError,
  onModeChange,
  onTierChange,
  onPriceChange,
}: Readonly<{
  tiers: ReadonlyArray<AdminPriceTier>;
  tierStatus: TierListStatus;
  /** False for an add-on that stands for "no selection": its price must stay 0. */
  canLink: boolean;
  /** The service is linked to a tier as stored. */
  isLinked: boolean;
  mode: ServicePriceMode;
  tierId: string;
  price: string;
  priceInvalid: boolean;
  tierError: string | null;
  onModeChange: (mode: ServicePriceMode) => void;
  onTierChange: (tierId: string) => void;
  onPriceChange: (price: string) => void;
}>) {
  const t = useTranslations("admin.services");
  const chosen = tiers.find((tier) => tier.id === tierId);

  // Without the tier list a linked service keeps its link untouched; there is nothing to pick.
  if (tierStatus === "hidden" && isLinked && mode === "tier") {
    return (
      <div className="flex flex-col gap-2 text-sm sm:col-span-2">
        <span className="font-semibold text-admin-ink">{t("create.price")}</span>
        <p role="status" className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs text-admin-muted">{t("price.linkedReadonly")}</p>
      </div>
    );
  }

  const priceInput = (
    <input
      inputMode="numeric"
      className={`${inputClass} ${priceInvalid ? "border-admin-danger" : "border-admin-border"}`}
      value={price}
      onChange={(event) => onPriceChange(event.target.value)}
      placeholder="6600"
      aria-label={t("create.price")}
      aria-invalid={priceInvalid}
    />
  );

  if (tierStatus === "hidden" || !canLink) {
    return (
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">{t("create.price")}</span>
        {priceInput}
        {/* Typed while linked only happens for the "no selection" add-on, so say why. */}
        {!canLink && (tierStatus !== "hidden" || (isLinked && mode === "custom")) ? <span className="text-xs text-admin-muted">{t("price.noSelectionCannotLink")}</span> : null}
      </label>
    );
  }

  return (
    <fieldset className="text-sm sm:col-span-2">
      <legend className="mb-2 font-semibold text-admin-ink">{t("create.price")}</legend>
      <div className="flex flex-col gap-2">
        <div role="group" aria-label={t("price.modeLabel")} className="flex w-fit rounded-lg border border-admin-border bg-admin-surface p-0.5">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => onModeChange(item)}
              className={`min-h-9 rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
                mode === item ? "bg-admin-accent text-admin-on-accent" : "text-admin-muted hover:text-admin-ink"
              }`}
            >
              {t(`price.mode.${item}`)}
            </button>
          ))}
        </div>
        {mode === "custom" ? (
          <>
            {priceInput}
            <span className="text-xs text-admin-muted">{t(isLinked ? "price.detachHint" : "price.customHint")}</span>
          </>
        ) : (
          <>
            <AdminPriceTierPicker
              label={t("price.tierLabel")}
              tiers={tiers}
              status={tierStatus}
              messages={{ loading: t("price.tiersLoading"), failed: t("price.tiersFailed"), empty: t("price.noTiers") }}
              isInvalid={Boolean(tierError)}
              value={chosen?.id ?? ""}
              onChange={onTierChange}
            />
            {tierStatus !== "ready" || tiers.length === 0 ? null : tierError ? (
              <span role="alert" className="text-xs text-admin-danger">{tierError}</span>
            ) : chosen ? (
              <span className="text-xs text-admin-muted">{t("price.tierHint", { amount: formatMoney(chosen.amount) })}</span>
            ) : (
              <span className="text-xs text-admin-muted">{t("price.pickTier")}</span>
            )}
          </>
        )}
      </div>
    </fieldset>
  );
}
