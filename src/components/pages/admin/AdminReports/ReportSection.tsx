"use client";

import { Card } from "@heroui/react";

import type { ApiClientError } from "@/service";
import {
  MISSING,
  formatDateTime,
  formatCell,
  toColumns,
  toMetricTiles,
  toRows,
  toSegmentTiles,
  type MetricTile,
  type ReportView,
} from "./normalize";

type ReportSectionProps = {
  readonly title: string;
  readonly report: ReportView | undefined;
  readonly isLoading: boolean;
  readonly error: ApiClientError | undefined;
  readonly rangeLabel: string;
  readonly emptyRowsMessage: string;
};

function MetricGrid({ tiles }: { readonly tiles: ReadonlyArray<MetricTile> }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className="rounded-lg border border-admin-border bg-admin-canvas px-4 py-3"
        >
          <dt className="text-xs text-admin-muted">{tile.label}</dt>
          <dd className="mt-1 text-lg font-extrabold tabular-nums text-admin-ink">
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * `report.error` for these endpoints is most often a 403: revenue-summary is
 * owner-only and the branch reports are scoped per role, so a manager sees a
 * refusal rather than a broken screen.
 */
function errorMessage(error: ApiClientError): string {
  if (error.status === 403) {
    return "Tài khoản của bạn không có quyền xem báo cáo này.";
  }
  return error.message || "Không tải được báo cáo.";
}

export function ReportSection({
  title,
  report,
  isLoading,
  error,
  rangeLabel,
  emptyRowsMessage,
}: ReportSectionProps) {
  const metricTiles = toMetricTiles(report);
  const segmentTiles = toSegmentTiles(report);
  const rows = toRows(report);
  const columns = toColumns(rows);

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-col gap-1 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">{title}</h2>
        <p className="text-xs text-admin-muted">
          {rangeLabel}
          {report?.generatedAt ? ` · Cập nhật ${formatDateTime(report.generatedAt)}` : ""}
        </p>
      </Card.Header>

      <Card.Content className="space-y-5 px-4 pb-5 pt-4 sm:px-5">
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-3 text-sm text-danger">
            {errorMessage(error)}
          </p>
        ) : isLoading ? (
          <p className="py-6 text-center text-sm text-admin-muted">Đang tải báo cáo…</p>
        ) : !report ? (
          <p className="py-6 text-center text-sm text-admin-muted">
            Chưa có dữ liệu cho khoảng thời gian này.
          </p>
        ) : (
          <>
            {metricTiles.length > 0 ? <MetricGrid tiles={metricTiles} /> : null}
            {segmentTiles.length > 0 ? <MetricGrid tiles={segmentTiles} /> : null}

            {metricTiles.length === 0 && segmentTiles.length === 0 ? (
              <p className="text-sm text-admin-muted">
                Báo cáo không trả về chỉ số nào cho khoảng thời gian này.
              </p>
            ) : null}

            {rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-admin-border">
                <table className="w-full min-w-max text-left text-sm">
                  <thead className="bg-admin-canvas">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className={`px-3 py-2 text-xs font-semibold text-admin-muted ${
                            column.isNumeric ? "text-right" : ""
                          }`}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={String(row.branchId ?? row.staffId ?? index)}
                        className="border-t border-admin-border"
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-3 py-2 text-admin-ink ${
                              column.isNumeric ? "text-right tabular-nums" : ""
                            }`}
                          >
                            {formatCell(column.key, row[column.key]) || MISSING}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-admin-border px-3 py-6 text-center text-sm text-admin-muted">
                {emptyRowsMessage}
              </p>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}
