import type { AdminSaleRule } from "@/service";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// Tokyo has no daylight saving, so a fixed offset is exact.
const TOKYO_OFFSET = 9 * HOUR;

export function previewSalePrice(
  original: number,
  rule: AdminSaleRule,
): { price: number; applies: boolean } {
  const price =
    rule.type === "FIXED" ? rule.value : Math.round((original * (100 - rule.value)) / 100);
  return { price, applies: price < original };
}

/** Start of the Tokyo calendar day containing `now`, as a UTC timestamp. */
function tokyoDayStart(now: Date): number {
  return Math.floor((now.getTime() + TOKYO_OFFSET) / DAY) * DAY - TOKYO_OFFSET;
}

export function saleWindowPreset(
  preset: "today" | "weekend" | "week",
  now: Date,
): { startsAt: string; endsAt: string } {
  const iso = (ms: number) => new Date(ms).toISOString();
  const dayStart = tokyoDayStart(now);
  if (preset === "today") {
    return { startsAt: iso(now.getTime()), endsAt: iso(dayStart + DAY - 1000) };
  }
  if (preset === "week") {
    return { startsAt: iso(now.getTime()), endsAt: iso(now.getTime() + 7 * DAY) };
  }
  const weekday = new Date(now.getTime() + TOKYO_OFFSET).getUTCDay(); // 0 = Sunday
  const daysToSunday = (7 - weekday) % 7;
  const sundayStart = dayStart + daysToSunday * DAY;
  const isWeekend = weekday === 0 || weekday === 6;
  const saturdayStart = sundayStart - DAY;
  return {
    startsAt: iso(isWeekend ? now.getTime() : saturdayStart),
    endsAt: iso(sundayStart + DAY - 1000),
  };
}

function splitIds(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function salePrefill(params: URLSearchParams): { designs: string[]; services: string[] } {
  return { designs: splitIds(params.get("designs")), services: splitIds(params.get("services")) };
}

export function describeSaleRule(
  rule: AdminSaleRule,
  formatMoney: (n: number) => string,
  t: (key: "fixed" | "percent", values: Record<string, string | number>) => string,
): string {
  return rule.type === "FIXED"
    ? t("fixed", { amount: formatMoney(rule.value) })
    : t("percent", { percent: rule.value });
}
