"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { adminService, useAdminNailDesigns } from "@/service";
import { DesignModal } from "./DesignModal";
import {
  adaptDesign,
  designStatusLabels,
  designStatuses,
  filterDesigns,
  paginate,
  type DesignRow,
} from "./data";

const pageSize = 8;

export function AdminNailDesignsComponent() {
  const { data, isLoading, error, mutate } = useAdminNailDesigns();

  const source = useMemo<ReadonlyArray<DesignRow>>(
    () => (data?.items ? data.items.map(adaptDesign) : []),
    [data],
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DesignRow | null>(null);
  const [creating, setCreating] = useState(false);

  const statuses = useMemo(() => designStatuses(source), [source]);
  const filtered = useMemo(() => filterDesigns(source, status, query), [source, status, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
          Trạng thái
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink">
            <option value="all">Tất cả</option>
            {statuses.map((code) => (<option key={code} value={code}>{designStatusLabels[code] ?? code}</option>))}
          </select>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminSearchField label="Tìm mẫu nail" placeholder="Tên mẫu..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
          <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
            <PlusIcon className="size-4" />Thêm mẫu
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">Đang tải mẫu nail…</p>
      ) : error ? (
        <p className="mb-3 text-xs text-admin-danger">Không tải được danh sách mẫu nail.</p>
      ) : null}

      <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Content className="min-w-0 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3">Mẫu</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-admin-muted">Không có mẫu phù hợp.</td></tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/*
                          The endpoint returns mediaIds, not a URL, so a
                          thumbnail needs the media access-url flow. Until that
                          is wired, show the placeholder rather than an <img>
                          bound to a field that never arrives.
                        */}
                        <span className="grid size-10 place-items-center rounded-lg bg-admin-soft text-admin-accent">✦</span>
                        <span className="font-medium text-admin-ink">{row.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                        {designStatusLabels[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>Sửa</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
          <span>Hiển thị {visible.length} trong tổng số {filtered.length} mẫu</span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
              <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
            ))}
          </div>
        </Card.Footer>
      </Card>

      <ProposalDecisionPanel />

      {creating ? <DesignModal design={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <DesignModal design={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

// The backend exposes only the decision endpoint for proposals (no list endpoint yet),
// so review is by proposal id until a listing contract exists.
function ProposalDecisionPanel() {
  const [proposalId, setProposalId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: "approve" | "reject") => {
    if (proposalId.trim().length < 1) return;
    setBusy(decision);
    setError(null);
    setMessage(null);
    try {
      await adminService.decideNailDesignProposal(proposalId.trim(), {
        decision,
        note: note.trim() || undefined,
      });
      setMessage(decision === "approve" ? "Đã duyệt đề xuất." : "Đã từ chối đề xuất.");
      setProposalId("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không xử lý được đề xuất.");
    } finally {
      setBusy(null);
    }
  };

  const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

  return (
    <Card className="mt-4 max-w-xl gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Duyệt đề xuất mẫu</h2>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">ID đề xuất</span>
        <input className={inputClass} value={proposalId} onChange={(event) => setProposalId(event.target.value)} placeholder="proposal-uuid" />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">Ghi chú (tuỳ chọn)</span>
        <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="primary" className="rounded-lg" isDisabled={busy !== null || !proposalId.trim()} onPress={() => void decide("approve")}>
          {busy === "approve" ? "Đang duyệt…" : "Duyệt"}
        </Button>
        <Button variant="outline" className="rounded-lg" isDisabled={busy !== null || !proposalId.trim()} onPress={() => void decide("reject")}>
          {busy === "reject" ? "Đang từ chối…" : "Từ chối"}
        </Button>
      </div>
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-nail-designs" } as const;
