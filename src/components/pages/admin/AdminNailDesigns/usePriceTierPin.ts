"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { isVersionConflict } from "@/components/pages/admin/AdminMarketing/home-announcements";
import { notifySuccess } from "@/lib/app-toast";
import { isPinnedTier } from "@/lib/price-tier-search";
import { adminService, type AdminPriceTier } from "@/service";

/**
 * Pins or unpins a price tier. A pin is an ordinary tier PATCH (`isPinned` only), so it needs the
 * tier's current version and the same permission as editing it; it never changes any price.
 * `pending` holds the tiers being written, so their button can wait; a version conflict reloads
 * the list (`onChanged`) so the retry carries the fresh version.
 */
export function usePriceTierPin(onChanged: () => void) {
  const t = useTranslations("admin.nailDesigns.tiers");
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggle = async (tier: AdminPriceTier) => {
    if (pending.has(tier.id)) return;
    const pin = !isPinnedTier(tier);
    setPending((current) => new Set(current).add(tier.id));
    setError(null);
    try {
      await adminService.updatePriceTier(tier.id, { isPinned: pin }, tier.version);
      notifySuccess(t(pin ? "pinSuccess" : "unpinSuccess", { name: tier.name }));
      onChanged();
    } catch (thrown) {
      const conflict = isVersionConflict(thrown);
      if (conflict) onChanged();
      setError(conflict ? t("conflict") : t("pinFailed", { name: tier.name }));
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(tier.id);
        return next;
      });
    }
  };

  return { pending, error, toggle } as const;
}
