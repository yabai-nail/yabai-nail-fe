export type PromotionFormValues = Readonly<{
  code: string;
  title: string;
  type: string;
  value: string;
  startAt: string;
  endAt: string;
  issuanceLimit: string;
}>;

export type PromotionValidationError =
  | "title"
  | "code"
  | "value"
  | "percentage"
  | "issuanceLimit"
  | "dates"
  | "dateOrder";

/**
 * Accept the grouping users commonly type for yen (10,000), but reject signs,
 * decimals and arbitrary characters instead of silently deleting them. The old
 * sanitiser turned `10.5` into `105` and `-10` into `10`.
 */
export function parsePromotionInteger(input: string): number | null {
  const normalized = input.trim().replaceAll(",", "").replaceAll("，", "");
  if (!/^\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isSafeInteger(value) ? value : null;
}

export function validatePromotionForm(
  values: PromotionFormValues,
  options: Readonly<{ isEdit: boolean; termsLocked: boolean }>,
): PromotionValidationError | null {
  if (values.title.trim().length < 2 || values.title.trim().length > 200) return "title";
  if (options.termsLocked) return null;

  const value = parsePromotionInteger(values.value);
  if (value === null || value <= 0) return "value";
  if (values.type === "PERCENT" && value > 100) return "percentage";

  if (!options.isEdit) {
    if (!/^[A-Z0-9_-]{3,60}$/.test(values.code.trim().toUpperCase())) return "code";
    const limit = parsePromotionInteger(values.issuanceLimit);
    if (limit === null || limit <= 0) return "issuanceLimit";
    if (!values.startAt || !values.endAt) return "dates";
  }

  if (values.startAt && values.endAt && values.endAt <= values.startAt) return "dateOrder";
  return null;
}

