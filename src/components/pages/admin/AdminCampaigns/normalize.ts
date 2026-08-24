import type { AdminNotificationCampaignMetrics } from "@/service";

/**
 * The audience `definition` is `additionalProperties: true` in the runtime
 * contract — the backend owns its shape, not the frontend. Rather than invent
 * filter fields that would silently drift from the real segment schema, the UI
 * takes the definition as JSON and only guarantees it parses to a plain object
 * (never an array or primitive), which is the one thing the campaign draft and
 * both preview endpoints require.
 */
export type ParsedDefinition =
  | { readonly ok: true; readonly value: Record<string, unknown> }
  | { readonly ok: false; readonly error: string };

export function parseAudienceDefinition(text: string): ParsedDefinition {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Nhập định nghĩa tập khách (JSON)." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON không hợp lệ — kiểm tra lại dấu ngoặc và dấu phẩy." };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Định nghĩa phải là một đối tượng JSON, ví dụ { }." };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

const NUMBER_FORMATTER = new Intl.NumberFormat("vi-VN");

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return NUMBER_FORMATTER.format(value);
}

const STATUS_LABELS: Readonly<Record<string, string>> = {
  draft: "Nháp",
  pending: "Chờ gửi",
  scheduled: "Đã lên lịch",
  queued: "Trong hàng đợi",
  sending: "Đang gửi",
  sent: "Đã gửi",
  completed: "Hoàn tất",
  delivered: "Đã gửi",
  cancelled: "Đã huỷ",
  canceled: "Đã huỷ",
  failed: "Thất bại",
};

export function campaignStatusLabel(status: string | undefined): string {
  if (!status) return "Không rõ";
  return STATUS_LABELS[status.toLowerCase()] ?? status;
}

/**
 * A campaign can only be cancelled while it has not gone out yet. When the
 * status is unknown we still allow the attempt — the backend is the authority
 * and will reject a too-late cancellation, whose error the UI surfaces.
 */
const NON_CANCELLABLE = new Set([
  "sent",
  "completed",
  "delivered",
  "cancelled",
  "canceled",
  "failed",
]);

export function isCancellableStatus(status: string | undefined): boolean {
  if (!status) return true;
  return !NON_CANCELLABLE.has(status.toLowerCase());
}

export type MetricRow = { readonly label: string; readonly value: string };

const KNOWN_METRIC_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["delivered", "Đã gửi"],
  ["opened", "Đã mở"],
  ["clicked", "Đã bấm"],
  ["failed", "Thất bại"],
];

/**
 * Renders the metric fields we know about in a stable order, then appends any
 * additional numeric fields the backend returns (the type carries an index
 * signature) so a newly added metric shows up instead of being dropped.
 */
export function metricRows(
  metrics: AdminNotificationCampaignMetrics | undefined,
): ReadonlyArray<MetricRow> {
  if (!metrics) return [];
  const rows: MetricRow[] = [];
  const seen = new Set<string>(["campaignId"]);

  for (const [key, label] of KNOWN_METRIC_LABELS) {
    seen.add(key);
    const raw = metrics[key];
    if (typeof raw === "number") {
      rows.push({ label, value: formatCount(raw) });
    }
  }

  for (const [key, raw] of Object.entries(metrics)) {
    if (seen.has(key)) continue;
    if (typeof raw === "number") {
      rows.push({ label: key, value: formatCount(raw) });
    }
  }

  return rows;
}
