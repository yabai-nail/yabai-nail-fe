"use client";

import { adminService, useAdminLoyaltyConfig } from "@/service";
import { JsonConfigEditor } from "./JsonConfigEditor";

/**
 * Loyalty configuration (tiers + earning/redemption rules) is a chain-wide
 * document saved with PUT. Read with SWR, edit as JSON, and send the current
 * version for optimistic concurrency. A tier count above the editor gives a
 * quick sense of the document without reading raw JSON.
 */
export function LoyaltyConfigTab() {
  const { data, isLoading, error, mutate } = useAdminLoyaltyConfig();

  const tierCount = Array.isArray(data?.tiers) ? data.tiers.length : null;

  return (
    <JsonConfigEditor
      heading="Cấu hình tích điểm"
      description="Hạng thành viên và quy tắc tích/đổi điểm áp dụng cho toàn chuỗi."
      config={data}
      version={data?.version}
      isLoading={isLoading}
      loadError={error ? "Không tải được cấu hình tích điểm." : null}
      summary={
        tierCount !== null ? (
          <span className="text-xs text-admin-muted">
            Số hạng thành viên đang cấu hình: <strong className="text-admin-ink">{tierCount}</strong>
          </span>
        ) : null
      }
      onSave={async (body, version) => {
        await adminService.updateLoyaltyConfig(body, version);
        await mutate();
      }}
    />
  );
}
