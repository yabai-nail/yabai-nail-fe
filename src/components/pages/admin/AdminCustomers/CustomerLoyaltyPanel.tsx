"use client";

import { useTranslations } from "next-intl";
import { GiftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useState } from "react";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { formatMoney, formatNumber } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminCustomerBenefits,
  useAdminCustomerNailHistory,
  useAdminPromotions,
} from "@/service";

// Read-side (benefits + nail history) and the two write mutations (adjust
// points, issue coupon) live together because they all pivot around the
// same customerId and share one refresh cadence.
export function CustomerLoyaltyPanel({
  branchId,
  customerId,
}: Readonly<{ branchId: string; customerId: string }>) {
  const t = useTranslations("admin.customers");
  const benefitsQuery = useAdminCustomerBenefits(branchId, customerId);
  const historyQuery = useAdminCustomerNailHistory(branchId, customerId);
  const promotionsQuery = useAdminPromotions();
  const benefits = benefitsQuery.data;
  const tierLabel = benefits?.tier ? ({ MEMBER: "Thành viên", SILVER: t("rank.silver"), GOLD: t("rank.gold"), PLATINUM: "Bạch kim" }[benefits.tier.toUpperCase()] ?? benefits.tier) : "—";
  const history = historyQuery.data?.items ?? [];
  const promotions = (promotionsQuery.data?.items ?? []).filter((promotion) => promotion.status === "ACTIVE");

  // Point-adjustment form state.
  const [deltaText, setDeltaText] = useState("");
  const [reason, setReason] = useState("");
  const [pointsPending, setPointsPending] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  async function submitPoints() {
    const delta = Number.parseInt(deltaText, 10);
    if (!Number.isFinite(delta) || delta === 0 || reason.trim().length === 0) return;
    setPointsPending(true);
    setPointsError(null);
    try {
      await adminService.adjustCustomerPoints(branchId, customerId, {
        pointsSigned: delta,
        reasonCode: reason.trim(),
      }, benefits?.version);
      notifySuccess("Đã cập nhật điểm khách hàng");
      setDeltaText("");
      setReason("");
      await benefitsQuery.mutate();
    } catch (thrown) {
      setPointsError(
        thrown instanceof Error ? thrown.message : t("loyalty.pointsFailed"),
      );
    } finally {
      setPointsPending(false);
    }
  }

  // Coupon-issuance form state.
  const [couponId, setCouponId] = useState("");
  const [couponPending, setCouponPending] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  async function submitCoupon() {
    if (!couponId.trim()) return;
    setCouponPending(true);
    setCouponError(null);
    try {
      await adminService.issueCustomerCoupon(branchId, customerId, {
        couponId: couponId.trim(),
      }, benefits?.version);
      notifySuccess("Đã phát coupon cho khách hàng");
      setCouponId("");
      await benefitsQuery.mutate();
    } catch (thrown) {
      setCouponError(
        thrown instanceof Error ? thrown.message : t("loyalty.couponFailed"),
      );
    } finally {
      setCouponPending(false);
    }
  }

  return (
    <section aria-labelledby="customer-loyalty-heading" className="space-y-3 border-t border-admin-border pt-3">
      <h3 id="customer-loyalty-heading" className="text-sm font-bold text-admin-ink">
        Ưu đãi và điểm tích luỹ
      </h3>

      {benefitsQuery.isLoading ? (
        <p className="text-xs text-admin-muted">{t("loyalty.loading")}</p>
      ) : benefitsQuery.error ? (
        <p role="alert" className="text-xs text-admin-danger">{t("loyalty.loadFailed")}</p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-admin-soft p-3 text-center text-xs">
          <div>
            <dt className="text-admin-muted">{t("detail.rank")}</dt>
            <dd className="mt-1 font-bold text-admin-ink">{tierLabel}</dd>
          </div>
          <div>
            <dt className="text-admin-muted">{t("detail.points")}</dt>
            <dd className="mt-1 font-bold text-admin-accent">
              {typeof benefits?.pointBalance === "number" ? formatNumber(benefits.pointBalance) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-admin-muted">Coupon</dt>
            <dd className="mt-1 font-bold text-admin-ink">
              {benefits?.coupons?.length ?? 0}
            </dd>
          </div>
        </dl>
      )}

      <div className="space-y-2 rounded-lg border border-admin-border p-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-admin-ink">
          <SparklesIcon className="size-4 text-admin-accent" />
          Cộng / trừ điểm
        </p>
        {/* min-w-0 on both inputs: an input's automatic minimum is its own
            intrinsic width, 184px here, so the 1fr track could not shrink below
            that and the pair needed 288px inside a 260px card. The reason field
            hung 28px out over the border. */}
        <div className="grid grid-cols-[6rem_1fr] gap-2 text-xs">
          <input
            type="number"
            value={deltaText}
            onChange={(event) => setDeltaText(event.target.value)}
            placeholder={t("loyalty.pointsPlaceholder")}
            className="min-w-0 rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("loyalty.reasonPlaceholder")}
            className="min-w-0 rounded-lg border border-admin-border bg-admin-surface p-2 text-admin-ink"
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            className="rounded-lg"
            onPress={() => void submitPoints()}
            isDisabled={pointsPending || benefits?.version === undefined || !reason.trim() || !Number.parseInt(deltaText, 10)}
          >
            {pointsPending ? t("loyalty.pointsPending") : t("loyalty.pointsSubmit")}
          </Button>
        </div>
        {pointsError ? <p role="alert" className="text-xs text-admin-danger">{pointsError}</p> : null}
      </div>

      <div className="space-y-2 rounded-lg border border-admin-border p-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-admin-ink">
          <GiftIcon className="size-4 text-admin-accent" />
          Phát coupon
        </p>
        {promotions.length > 0 ? (
          <AdminSelectField
            label={t("loyalty.pickCoupon")}
            value={couponId}
            onChange={setCouponId}
            fullWidth
            options={promotions.map((promotion) => ({
              value: promotion.id,
              label: promotion.title ?? promotion.name ?? promotion.code ?? t("loyalty.unnamedCoupon"),
            }))}
          />
        ) : (
          <p className="text-xs text-admin-muted">
            {promotionsQuery.isLoading ? t("loyalty.loadingCoupons") : t("loyalty.noCoupons")}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            className="rounded-lg"
            onPress={() => void submitCoupon()}
            isDisabled={couponPending || benefits?.version === undefined || !couponId.trim()}
          >
            {couponPending ? t("loyalty.couponPending") : t("loyalty.couponSubmit")}
          </Button>
        </div>
        {couponError ? <p role="alert" className="text-xs text-admin-danger">{couponError}</p> : null}
      </div>

      <div>
        <h4 className="text-xs font-bold text-admin-ink">{t("loyalty.historyHeading")}</h4>
        {historyQuery.isLoading ? (
          <p className="mt-1 text-xs text-admin-muted">{t("loyalty.historyLoading")}</p>
        ) : historyQuery.error ? (
          <p role="alert" className="mt-1 text-xs text-admin-danger">{t("loyalty.historyFailed")}</p>
        ) : history.length === 0 ? (
          <p className="mt-1 text-xs text-admin-muted">{t("loyalty.historyEmpty")}</p>
        ) : (
          <ul className="mt-1 space-y-1 text-xs">
            {history.slice(0, 5).map((entry) => (
              <li
                key={entry.appointmentId}
                className="grid grid-cols-[6rem_1fr_auto] gap-2"
              >
                <span className="text-admin-muted">
                  {new Date(entry.startsAt).toLocaleDateString("vi-VN")}
                </span>
                <span className="truncate text-admin-ink">
                  {(entry.services ?? []).map((service) => service.serviceName).join(", ") || "—"}
                </span>
                <strong>
                  {formatMoney(
                    (entry.services ?? []).reduce((sum, service) => sum + (service.unitPrice ?? 0), 0),
                  )}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
