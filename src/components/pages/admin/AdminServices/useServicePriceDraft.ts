"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ApiClientError, type AdminPriceTier } from "@/service";
import { isServicePriceReady, servicePricePayload, type ServicePriceMode } from "./service-price";
import { parseCatalogInteger } from "./service-numbers";
import type { TierListStatus } from "./ServicePriceFields";

/**
 * The price choice shared by the create and edit dialogs. `stored` is the service as saved
 * (undefined when creating). A new service starts on a typed price, as it always has; one that
 * is linked opens on its tier.
 */
export function useServicePriceDraft({
  tiers,
  tierStatus,
  stored,
  serviceType,
  representsNoSelection,
  onTiersStale,
}: Readonly<{
  tiers: ReadonlyArray<AdminPriceTier>;
  tierStatus: TierListStatus;
  stored?: { readonly price: number; readonly priceTierId: string | null };
  serviceType: "BASE" | "ADD_ON";
  representsNoSelection: boolean;
  onTiersStale: () => void;
}>) {
  const t = useTranslations("admin.services");
  const [mode, setMode] = useState<ServicePriceMode>(stored?.priceTierId ? "tier" : "custom");
  const [tierId, setTierId] = useState(stored?.priceTierId ?? "");
  const [price, setPrice] = useState(stored ? String(stored.price) : "");
  const [tierError, setTierError] = useState<string | null>(null);

  // The API refuses a tier on the add-on that means "no selection", whose price must be 0.
  // It also applies without the tier permission: such a service is detached (null + typed price),
  // which the service write alone allows, instead of sending a kept link the API would refuse.
  const noSelection = serviceType === "ADD_ON" && representsNoSelection;
  const canLink = tierStatus !== "hidden" && !noSelection;
  const effectiveMode: ServicePriceMode = noSelection ? "custom" : mode;
  const state = { mode: effectiveMode, tierId, manualPrice: parseCatalogInteger(price) };
  const storedTierId = stored ? stored.priceTierId : undefined;
  const ready = isServicePriceReady(state, tiers, storedTierId, canLink, serviceType);

  return {
    ready,
    /** The `priceTierId`/`price` part of the body; only read once `ready`. */
    payload: () => servicePricePayload(state, tiers, storedTierId, canLink) ?? {},
    /** True when the refusal was about the tier, which is then shown on the tier field. */
    explainError: (thrown: unknown) => {
      if (!(thrown instanceof ApiClientError) || thrown.code !== "PRICE_TIER_NOT_FOUND") return false;
      setTierError(t("price.tierNotFound"));
      onTiersStale();
      return true;
    },
    fields: {
      tiers,
      tierStatus,
      canLink,
      isLinked: Boolean(stored?.priceTierId),
      mode: effectiveMode,
      tierId,
      price,
      priceInvalid: effectiveMode === "custom" && price.trim() !== "" && !ready,
      tierError,
      onModeChange: (next: ServicePriceMode) => {
        // Leaving a tier keeps its amount as the typed price, matching what the API keeps.
        const chosen = tiers.find((tier) => tier.id === tierId);
        if (next === "custom" && mode === "tier" && chosen) setPrice(String(chosen.amount));
        setMode(next);
      },
      onTierChange: (next: string) => { setTierId(next); setTierError(null); },
      onPriceChange: setPrice,
    },
  };
}
