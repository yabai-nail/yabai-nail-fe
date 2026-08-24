"use client";

import { Button, Card } from "@heroui/react";

import { statusLabel, type DesignRow } from "./normalize";

function StatusChip({ status }: Readonly<{ status: string }>) {
  return (
    <span className="rounded-full bg-admin-soft px-2 py-0.5 text-[0.7rem] font-semibold text-admin-accent">
      {statusLabel(status)}
    </span>
  );
}

export function DesignGrid({
  designs,
  isLoading,
  errorMessage,
  onEdit,
}: Readonly<{
  designs: ReadonlyArray<DesignRow>;
  isLoading: boolean;
  errorMessage: string | null;
  onEdit: (design: DesignRow) => void;
}>) {
  if (errorMessage) {
    return (
      <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
        {errorMessage}
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-admin-muted" role="status">
        Đang tải mẫu nail…
      </p>
    );
  }

  if (designs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-admin-muted" role="status">
        Chưa có mẫu nail nào. Bấm “Thêm mẫu” để tạo mẫu đầu tiên.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {designs.map((design) => (
        <li key={design.id}>
          <Card className="overflow-hidden rounded-lg border-admin-border bg-admin-surface shadow-none">
            {design.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                alt={design.name || "Mẫu nail"}
                className="aspect-square w-full object-cover"
                src={design.imageUrl}
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center bg-admin-soft text-xs font-semibold text-admin-accent">
                Chưa có ảnh
              </div>
            )}
            <Card.Content className="p-3">
              <p className="truncate text-sm font-semibold text-admin-ink">
                {design.name || "Chưa đặt tên"}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-admin-muted">
                <StatusChip status={design.status} />
                {design.style ? <span className="truncate">{design.style}</span> : null}
              </p>
              <Button
                variant="ghost"
                className="mt-2 w-full rounded-lg"
                onPress={() => onEdit(design)}
              >
                Sửa
              </Button>
            </Card.Content>
          </Card>
        </li>
      ))}
    </ul>
  );
}
