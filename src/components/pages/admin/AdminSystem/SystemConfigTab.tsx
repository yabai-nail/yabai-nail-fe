"use client";

import { adminService, useAdminSystemConfig } from "@/service";
import { JsonConfigEditor } from "./JsonConfigEditor";

/**
 * System configuration is a chain-wide document. Read it with SWR, edit as
 * JSON, and PATCH with the current version for optimistic concurrency. When the
 * document exposes a `features` flag map, surface it read-only above the editor
 * so the effect of a change is legible without parsing raw JSON.
 */
export function SystemConfigTab() {
  const { data, isLoading, error, mutate } = useAdminSystemConfig();

  const features =
    data?.features && typeof data.features === "object"
      ? (data.features as Record<string, boolean>)
      : undefined;
  const featureEntries = features ? Object.entries(features) : [];

  return (
    <JsonConfigEditor
      heading="Cấu hình hệ thống"
      description="Cấu hình áp dụng cho toàn chuỗi. Chỉnh sửa cẩn thận — thay đổi ảnh hưởng mọi chi nhánh."
      config={data}
      version={data?.version}
      isLoading={isLoading}
      loadError={error ? "Không tải được cấu hình hệ thống." : null}
      summary={
        featureEntries.length ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-admin-muted">Cờ tính năng đang bật/tắt</span>
            <div className="flex flex-wrap gap-2">
              {featureEntries.map(([key, value]) => (
                <span
                  key={key}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    value ? "bg-admin-soft text-admin-accent" : "border border-admin-border text-admin-muted"
                  }`}
                >
                  {key}: {value ? "bật" : "tắt"}
                </span>
              ))}
            </div>
          </div>
        ) : null
      }
      onSave={async (body, version) => {
        await adminService.updateSystemConfig(body, version);
        await mutate();
      }}
    />
  );
}
