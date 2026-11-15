import type { AdminPriceTier } from "@/service";
import { isValidServiceAmount } from "./service-numbers";

/** "tier": the service's price follows a Mức giá; "custom": the price typed on the service. */
export type ServicePriceMode = "tier" | "custom";

export type ServicePriceState = {
  readonly mode: ServicePriceMode;
  readonly tierId: string;
  /** Parsed typed price, or null when the field is not a whole number. */
  readonly manualPrice: number | null;
};

/**
 * The price part of a service create/update body, per the API contract: a tier id links the
 * service and the API takes the tier's amount; `null` detaches and keeps the price sent with it;
 * an omitted `priceTierId` on PATCH leaves the link as stored.
 *
 * `storedTierId` is the link the service has now (undefined for a new service). `canLink` is
 * false when the tier list cannot be read or the service is an add-on that may not link.
 */
export function servicePricePayload(
  state: ServicePriceState,
  tiers: ReadonlyArray<AdminPriceTier>,
  storedTierId: string | null | undefined,
  canLink: boolean,
): { readonly priceTierId?: string | null; readonly price?: number } | null {
  const isNew = storedTierId === undefined;
  if (canLink && state.mode === "tier") {
    const tier = tiers.find((item) => item.id === state.tierId);
    if (!tier) return null;
    // Create still carries `price` (the draft requires one); the API overwrites it with the amount.
    return isNew ? { priceTierId: tier.id, price: tier.amount } : { priceTierId: tier.id };
  }
  // Linked but the tiers are unreadable here: send nothing, so the link and its price stay.
  if (!canLink && storedTierId && state.mode === "tier") return {};
  if (state.manualPrice === null) return null;
  return storedTierId ? { priceTierId: null, price: state.manualPrice } : { price: state.manualPrice };
}

export function isServicePriceReady(
  state: ServicePriceState,
  tiers: ReadonlyArray<AdminPriceTier>,
  storedTierId: string | null | undefined,
  canLink: boolean,
  serviceType: "BASE" | "ADD_ON",
): boolean {
  const payload = servicePricePayload(state, tiers, storedTierId, canLink);
  // A linked price is the tier's (always ≥ 1); only a typed one needs the per-type rule.
  return payload !== null && (Boolean(payload.priceTierId) || payload.price === undefined || isValidServiceAmount(payload.price, serviceType));
}
