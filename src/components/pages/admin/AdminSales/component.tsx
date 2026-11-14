"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { selectBaseServices } from "@/components/pages/admin/AdminServices/data";
import { formatMoney } from "@/lib/admin-format";
import {
  useAdminNailDesigns,
  useAdminPermission,
  useAdminPriceTiers,
  useAdminSales,
  useAdminServiceCategories,
  useAdminServices,
  type AdminSale,
} from "@/service";
import { SaleActionModal, type SaleAction } from "./SaleActionModal";
import { SaleForm } from "./SaleForm";
import { SaleList } from "./SaleList";
import {
  designTarget,
  duplicateSaleForm,
  newSaleForm,
  saleFormFromSale,
  saleOptionsStatus,
  salePrefill,
  serviceTarget,
  type SaleForm as SaleFormState,
  type SaleFormStatus,
} from "./data";

/** Which sale the form edits (null for a new one) and the values it opens with. */
type Editor = { readonly sale: AdminSale | null; readonly initial: SaleFormState };

export function AdminSalesComponent() {
  const t = useTranslations("admin.sales");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canWrite = useAdminPermission("promotion.write.all");
  // Designs and tiers are read with the catalogue permission; without it the design block has
  // nothing to list, rather than a 403 on every visit.
  const canReadDesigns = useAdminPermission("design.manage.all");

  const sales = useAdminSales();
  const designs = useAdminNailDesigns(undefined, canReadDesigns);
  const tiers = useAdminPriceTiers(canReadDesigns);
  const services = useAdminServices();
  const categories = useAdminServiceCategories();

  const designTargets = useMemo(() => (designs.data?.items ?? []).map(designTarget), [designs.data]);
  // Add-ons are never on sale, so only base services can be picked or counted.
  const serviceTargets = useMemo(
    () => selectBaseServices(services.data?.items ?? []).map(serviceTarget),
    [services.data],
  );
  const tierGroups = useMemo(
    () => (tiers.data?.items ?? []).map((tier) => ({ id: tier.id, label: `${tier.name} · ${formatMoney(tier.amount)}` })),
    [tiers.data],
  );
  // The category id is the public key the services list reports as `categoryId`.
  const categoryGroups = useMemo(
    () =>
      (categories.data?.items ?? []).map((category) => ({
        id: category.id,
        label: typeof category.nameVi === "string" && category.nameVi ? category.nameVi : category.name,
      })),
    [categories.data],
  );
  // While a list loads, or if it failed, the form says so instead of "none yet" or a count of 0.
  const formStatus: SaleFormStatus = {
    designs: saleOptionsStatus(designs),
    services: saleOptionsStatus(services),
    tiers: saleOptionsStatus(tiers),
    categories: saleOptionsStatus(categories),
    preview: saleOptionsStatus(designs, services),
  };
  // "/admin/sales?new=1&designs=…" (the tables' "Tạo sale" bar) opens the form with those picks.
  const [editor, setEditor] = useState<Editor | null>(() =>
    searchParams.get("new") === "1" ? { sale: null, initial: newSaleForm(new Date(), salePrefill(searchParams)) } : null,
  );
  const [pending, setPending] = useState<{ sale: AdminSale; action: SaleAction } | null>(null);

  const closeEditor = () => {
    setEditor(null);
    // Drop the shortcut's query, so a reload does not open the form again.
    if (searchParams.has("new")) router.replace(pathname);
  };
  const refresh = () => void sales.mutate();
  // The dialogs keep the copy of the sale they opened with, so a background refresh never slips
  // a newer version under the owner's edit. Only after the API refused a stale version do they
  // take the fresh copy (null when the sale is gone).
  const freshSale = async (id: string) => (await sales.mutate())?.items.find((item) => item.id === id) ?? null;
  const reloadEditor = async () => {
    if (!editor?.sale) return;
    const fresh = await freshSale(editor.sale.id);
    if (fresh) setEditor({ sale: fresh, initial: saleFormFromSale(fresh) });
    else closeEditor();
  };
  const reloadPending = async () => {
    if (!pending) return;
    const fresh = await freshSale(pending.sale.id);
    setPending(fresh ? { sale: fresh, action: pending.action } : null);
  };
  const createButton = (
    <Button
      variant="primary"
      className="rounded-lg"
      isDisabled={!canWrite}
      onPress={() => setEditor({ sale: null, initial: newSaleForm(new Date()) })}
    >
      <PlusIcon className="size-4" />{t("create")}
    </Button>
  );

  return (
    <AdminPageLayout>
      <div className="mb-4 flex flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-1 text-xs leading-5 text-admin-muted">
          <p>{t("description")}</p>
          <p className="font-medium text-admin-ink">{t("quickGuide")}</p>
          <p>{t("availability")}</p>
          {canWrite ? null : <p role="status">{t("readOnly")}</p>}
        </div>
        {createButton}
      </div>

      <SaleList
        sales={sales.data?.items ?? []}
        isLoading={sales.isLoading}
        failed={Boolean(sales.error)}
        designTargets={designTargets}
        serviceTargets={serviceTargets}
        canWrite={canWrite}
        createButton={createButton}
        onEdit={(sale) => setEditor({ sale, initial: saleFormFromSale(sale) })}
        onDuplicate={(sale) =>
          setEditor({ sale: null, initial: duplicateSaleForm(sale, t("form.duplicateName", { name: sale.name }), new Date()) })
        }
        onEnd={(sale) => setPending({ sale, action: "end" })}
        onDelete={(sale) => setPending({ sale, action: "delete" })}
      />

      {canWrite && editor ? (
        <SaleForm
          // A reloaded copy starts the form afresh.
          key={editor.sale ? `${editor.sale.id}:${editor.sale.version}` : "new"}
          sale={editor.sale}
          initial={editor.initial}
          designTargets={designTargets}
          serviceTargets={serviceTargets}
          tierGroups={tierGroups}
          categoryGroups={categoryGroups}
          status={formStatus}
          onClose={closeEditor}
          onSaved={refresh}
          onReload={() => void reloadEditor()}
        />
      ) : null}
      {canWrite && pending ? (
        <SaleActionModal
          sale={pending.sale}
          action={pending.action}
          onClose={() => setPending(null)}
          onDone={refresh}
          onConflict={() => void reloadPending()}
        />
      ) : null}
    </AdminPageLayout>
  );
}
