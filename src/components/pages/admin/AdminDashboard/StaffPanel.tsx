"use client";

import { Avatar, Button, Card, Chip } from "@heroui/react";
import { useMemo } from "react";

import { useAdminBranch, useAdminStaffPerformance } from "@/service";
import { buildStaffCards, currentMonthPeriod } from "./adapters";

export function StaffPanel() {
  const { branchId } = useAdminBranch();
  const period = useMemo(() => currentMonthPeriod(new Date()), []);
  const { data, error, isLoading } = useAdminStaffPerformance(branchId, { period });

  const members = useMemo(() => buildStaffCards(data?.rows), [data]);

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-8">
      <Card.Header className="flex flex-row items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">
          Nhân viên <span className="font-normal text-admin-muted">(kỳ {period})</span>
        </h2>
        <Button size="sm" variant="ghost" className="rounded-lg text-xs text-admin-accent">
          Xem tất cả
        </Button>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-3 text-center text-xs text-danger">
            Không tải được hiệu suất nhân viên.
          </p>
        ) : !branchId || isLoading ? (
          <p className="py-3 text-center text-xs text-admin-muted">Đang tải danh sách nhân viên…</p>
        ) : members.length === 0 ? (
          <p className="py-3 text-center text-xs text-admin-muted">Kỳ {period} chưa có nhân viên nào.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {members.map((member) => {
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
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
