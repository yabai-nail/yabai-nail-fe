const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVnd(value: number) {
  return vndFormatter.format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export const adminFormatMeta = {
  world: "pure",
  domain: "admin-format",
} as const;
