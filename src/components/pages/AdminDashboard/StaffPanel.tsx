import { Avatar, Button, Card, Chip } from "@heroui/react";
import { staffMembers } from "./data";

export function StaffPanel() {
  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-8">
      <Card.Header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">Nhân viên</h2>
        <Button size="sm" variant="ghost" className="rounded-lg text-xs text-admin-accent">
          Xem tất cả
        </Button>
      </Card.Header>
      <Card.Content className="grid grid-cols-1 gap-3 px-4 pb-4 pt-3 sm:grid-cols-2 sm:px-5 sm:pb-5 xl:grid-cols-4">
        {staffMembers.map((member) => {
          const isWorking = member.status === "Đang làm";

          return (
            <article key={member.id} className="rounded-xl border border-admin-border p-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm" color={isWorking ? "accent" : "default"}>
                  <Avatar.Fallback>{member.initials}</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-semibold text-admin-ink">{member.name}</h3>
                  <Chip size="sm" variant="soft" color={isWorking ? "accent" : "default"} className="mt-1">
                    <Chip.Label>{member.status}</Chip.Label>
                  </Chip>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-admin-muted">Doanh thu</dt>
                  <dd className="font-semibold text-admin-ink">{member.revenue}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-admin-muted">Dự kiến nhận</dt>
                  <dd className="font-semibold text-admin-ink">{member.payout}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </Card.Content>
    </Card>
  );
}
