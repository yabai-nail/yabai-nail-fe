"use client";

import { Chip } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/admin-format";
import type { AdminAppliedSale } from "@/service";

type AdminSalePriceProps = {
  readonly original: number | null;
  readonly sale?: AdminAppliedSale | null;
};

/**
 * Shows a price, or -- while a sale applies -- the struck original, the bold sale price and a
 * "SALE" chip. The text chip and the strikethrough carry the meaning, so colour is never the
 * only signal; the chip's title and sr-only text name the sale and when it ends (Tokyo time).
 */
export function AdminSalePrice({ original, sale }: AdminSalePriceProps) {
  const t = useTranslations("admin.common.sale");
  const locale = useLocale();

  if (!sale) {
    return <span>{original === null ? "—" : formatMoney(original)}</span>;
  }

  const endsAt = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Tokyo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(sale.endsAt));
  const tooltip = t("tooltip", { name: sale.name, endsAt });

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {original !== null ? (
        <span className="text-admin-muted line-through">{formatMoney(original)}</span>
      ) : null}
      <span className="font-semibold text-admin-ink">{formatMoney(sale.price)}</span>
      <Chip size="sm" variant="soft" color="danger" title={tooltip}>
        <Chip.Label>{t("badge")}</Chip.Label>
        <span className="sr-only">{tooltip}</span>
      </Chip>
    </span>
  );
}

export const meta = { world: "pure", domain: "admin-sale-price" } as const;
