"use client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { formatDateTime, type DesignRow } from "./normalize";

/**
 * Customer proposals awaiting a decision.
 *
 * The backend exposes **no list operation for proposals** — the whole catalog
 * (`src/service/api/operations.ts`, and the 168 paths in runtime Swagger) holds
 * exactly one proposal route:
 * `POST /api/v1/admin/nail-design-proposals/{proposalId}/decision`. So the queue
 * is derived from the nail-design list: a row that carries a proposal id is a
 * proposal, and that id is the only thing the decision route accepts. Nothing
 * here invents a proposal that the list did not hand us.
 */
export function ProposalQueue({
  proposals,
  pendingWithoutProposalId,
  isLoading,
  onDecided,
}: Readonly<{
  proposals: ReadonlyArray<DesignRow>;
  pendingWithoutProposalId: number;
  isLoading: boolean;
  onDecided: () => void;
}>) {
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const decide = async (row: DesignRow, decision: "approve" | "reject") => {
    setBusyId(row.proposalId);
    setError(null);
    try {
      await adminService.decideNailDesignProposal(row.proposalId, { decision }, row.version);
      onDecided();
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : "Không gửi được quyết định.",
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Content className="p-4">
        <h2 className="text-sm font-bold text-admin-ink">Đề xuất từ khách</h2>
        <p className="mt-1 text-xs text-admin-muted">
          Duyệt mẫu nail do khách gửi lên trước khi đưa vào bộ sưu tập.
        </p>

        {error ? (
          <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="mt-4 text-sm text-admin-muted" role="status">
            Đang tải đề xuất…
          </p>
        ) : proposals.length === 0 ? (
          <p className="mt-4 text-sm text-admin-muted" role="status">
            Chưa có đề xuất nào chờ duyệt.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {proposals.map((proposal) => (
              <li
                key={proposal.proposalId}
                className="rounded-lg border border-admin-border p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-admin-soft">
                    {proposal.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        alt=""
                        className="size-full object-cover"
                        src={proposal.imageUrl}
                      />
                    ) : (
                      <span className="text-[0.6rem] font-semibold text-admin-accent">
                        Không ảnh
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-admin-ink">
                      {proposal.name || "Mẫu chưa đặt tên"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-admin-muted">
                      {proposal.proposedBy || "Khách ẩn danh"} ·{" "}
                      {formatDateTime(proposal.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1 rounded-lg"
                    isDisabled={busyId !== ""}
                    onPress={() => void decide(proposal, "approve")}
                  >
                    <CheckCircleIcon aria-hidden="true" className="size-4" />
                    {busyId === proposal.proposalId ? "Đang gửi…" : "Chấp nhận"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-lg"
                    isDisabled={busyId !== ""}
                    onPress={() => void decide(proposal, "reject")}
                  >
                    <XCircleIcon aria-hidden="true" className="size-4" />
                    Từ chối
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pendingWithoutProposalId > 0 ? (
          // Saying this beats a queue that silently drops rows the salon can see
          // sitting at "chờ duyệt" in the grid.
          <p className="mt-4 border-t border-admin-border pt-3 text-xs text-admin-muted">
            {pendingWithoutProposalId} mẫu đang ở trạng thái chờ duyệt nhưng không kèm
            mã đề xuất, nên không duyệt được ở đây. Xem trong lưới mẫu bên trái.
          </p>
        ) : null}
      </Card.Content>
    </Card>
  );
}
