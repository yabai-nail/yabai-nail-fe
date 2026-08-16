export function calculateCommission(revenue: number, rate: number) {
  if (!Number.isFinite(revenue) || revenue < 0) {
    throw new RangeError("Revenue must be a non-negative finite number.");
  }

  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new RangeError("Commission rate must be between 0 and 100.");
  }

  return Math.round((revenue * rate) / 100);
}
