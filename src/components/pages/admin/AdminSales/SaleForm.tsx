"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { isVersionConflict } from "@/components/pages/admin/AdminMarketing/home-announcements";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, ApiClientError, type AdminSale } from "@/service";
import { SalePreview } from "./SalePreview";
import { SaleScopeFields, type SaleGroupOption } from "./SaleScopeFields";
import { SaleWindowFields } from "./SaleWindowFields";
import { SaleSummary } from "./SaleSummary";
import {
  buildSaleInput,
  SALE_NAME_MAX,
  saleFormErrors,
  saleFormPreview,
  type SaleField,
  type SaleForm as SaleFormState,
  type SaleFormStatus,
  type SaleTarget,
} from "./data";

const inputClass = "min-h-10 rounded-lg border bg-admin-surface px-3 text-admin-ink";
const FIELDS: ReadonlyArray<SaleField> = ["name", "startsAt", "endsAt", "rule", "scope"];

/** The API's `SALE_INVALID` names the field it refused; anything else is a general failure. */
function refusedField(thrown: unknown): SaleField | null {
  if (!(thrown instanceof ApiClientError) || thrown.code !== "SALE_INVALID") return null;
  const field = (thrown.details as { field?: unknown } | undefined)?.field;
  return FIELDS.find((known) => known === field) ?? null;
}

/** A numbered form section, so the three steps read as one short form, not a wizard. */
function Section({ step, title, children }: Readonly<{ step: number; title: string; children: ReactNode }>) {
  return (
    <section aria-label={title} className="grid gap-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-admin-ink">
        <span aria-hidden className="grid size-6 place-items-center rounded-full bg-admin-soft text-xs text-admin-accent">{step}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldError({ id, children }: Readonly<{ id: string; children: ReactNode }>) {
  return <span id={id} className="text-xs text-admin-danger">{children}</span>;
}

/**
 * Create or edit a sale (`sale` set) in one wide modal: name and time, the price rule, and what
 * it applies to, with a live preview beside the form (below it on narrow screens).
 *
 * An edit saves against the version it opened with. If the sale changed elsewhere meanwhile the
 * API refuses it, and the form offers `onReload` (open the fresh copy) instead of overwriting.
 */
export function SaleForm({
  sale,
  initial,
  designTargets,
  serviceTargets,
  tierGroups,
  categoryGroups,
  status,
  onClose,
  onSaved,
  onReload,
}: Readonly<{
  sale: AdminSale | null;
  initial: SaleFormState;
  designTargets: ReadonlyArray<SaleTarget>;
  serviceTargets: ReadonlyArray<SaleTarget>;
  tierGroups: ReadonlyArray<SaleGroupOption>;
  categoryGroups: ReadonlyArray<SaleGroupOption>;
  status: SaleFormStatus;
  onClose: () => void;
  onSaved: () => void;
  onReload: () => void;
}>) {
  const t = useTranslations("admin.sales");
  const [form, setForm] = useState(initial);
  // Client errors show once a save was tried; a refusal from the API shows under its field.
  const [attempted, setAttempted] = useState(false);
  const [serverField, setServerField] = useState<SaleField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  // A price that cuts items to half or less is usually a typo, so the first save only asks; the
  // key is what was asked about, and changing the price or scope asks again.
  const [deepAsked, setDeepAsked] = useState<string | null>(null);
  // Set when a save is blocked or refused; the effect brings that error into view once it shows,
  // since it may sit below the fold of the scrolling modal. A new object each time re-runs it.
  const [reveal, setReveal] = useState<{ target: SaleField | "general" } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const at = reveal && formRef.current?.querySelector<HTMLElement>(`[data-sale-field="${reveal.target}"]`);
    if (!at) return;
    at.scrollIntoView({ block: "center" });
    if (reveal.target === "general") return;
    const focusable = at.matches("input, button") ? at : at.querySelector<HTMLElement>("input, button");
    (focusable ?? at).focus({ preventScroll: true });
  }, [reveal]);

  const errors = saleFormErrors(form);
  const deep = saleFormPreview(form, designTargets, serviceTargets)?.deep ?? 0;
  const deepKey = deep > 0 ? JSON.stringify([form.ruleType, form.ruleValue, form.designs, form.services]) : null;
  const confirmingDeep = deepKey !== null && deepAsked === deepKey;
  const shows = (field: SaleField) => serverField === field || (attempted && Boolean(errors[field]));
  const update = (patch: Partial<SaleFormState>, ...fields: SaleField[]) => {
    setForm((current) => ({ ...current, ...patch }));
    if (serverField && fields.includes(serverField)) setServerField(null);
  };

  const submit = async () => {
    setAttempted(true);
    const input = buildSaleInput(form);
    if (busy) return;
    if (!input || Object.keys(errors).length > 0) {
      // An unreadable rule is always one of the errors, so a first field is always found.
      const first = FIELDS.find((field) => errors[field]);
      if (first) setReveal({ target: first });
      return;
    }
    if (deepKey !== null && !confirmingDeep) {
      setDeepAsked(deepKey);
      setError(null);
      setReveal({ target: "general" });
      return;
    }
    setBusy(true);
    setError(null);
    setConflict(false);
    setServerField(null);
    try {
      if (sale) await adminService.updateSale(sale.id, input, sale.version);
      else await adminService.createSale(input);
      notifySuccess(sale ? t("form.updated", { name: input.name }) : t("form.created", { name: input.name }));
      onSaved();
      onClose();
    } catch (thrown) {
      const field = refusedField(thrown);
      const changedElsewhere = isVersionConflict(thrown);
      setConflict(changedElsewhere);
      setServerField(field);
      setError(field ? null : changedElsewhere ? t("form.conflict") : t("form.errors.saveFailed"));
      setReveal({ target: field ?? "general" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog className="p-0">
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {sale ? t("form.editTitle") : t("form.createTitle")}
              </Modal.Heading>
              <p className="mt-2 text-sm leading-5 text-admin-muted">{t("form.guide")}</p>
            </Modal.Header>
            <form ref={formRef} noValidate className="contents" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
              <Modal.Body className="mx-0 grid min-w-0 gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="grid min-w-0 content-start gap-6">
                  <Section step={1} title={t("form.basics")}>
                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-semibold text-admin-ink">{t("form.name")}</span>
                      <input
                        data-sale-field="name"
                        className={`${inputClass} ${shows("name") ? "border-admin-danger" : "border-admin-border"}`}
                        value={form.name}
                        maxLength={SALE_NAME_MAX}
                        onChange={(event) => update({ name: event.target.value }, "name")}
                        placeholder={t("form.namePlaceholder")}
                        aria-invalid={shows("name")}
                        aria-describedby={shows("name") ? "sale-name-error" : undefined}
                        autoFocus
                      />
                      {shows("name") ? <FieldError id="sale-name-error">{t("form.errors.name")}</FieldError> : null}
                    </label>
                    <SaleWindowFields
                      value={form}
                      startError={shows("startsAt") ? t("form.errors.startsAt") : null}
                      endError={shows("endsAt") ? t("form.errors.endsAt") : null}
                      onChange={(patch) => update(patch, "startsAt", "endsAt")}
                    />
                  </Section>

                  <Section step={2} title={t("form.price")}>
                    <div role="group" aria-label={t("form.ruleType")} className="flex w-fit rounded-lg border border-admin-border bg-admin-surface p-0.5">
                      {(["FIXED", "PERCENT"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={form.ruleType === type}
                          // A yen amount means nothing as a percent, so switching clears the value.
                          onClick={() => { if (form.ruleType !== type) update({ ruleType: type, ruleValue: "" }, "rule"); }}
                          className={`min-h-9 rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
                            form.ruleType === type ? "bg-admin-accent text-admin-on-accent" : "text-admin-muted hover:text-admin-ink"
                          }`}
                        >
                          {t(`form.ruleTypes.${type}`)}
                        </button>
                      ))}
                    </div>
                    <label className="flex max-w-xs flex-col gap-2 text-sm">
                      <span className="font-semibold text-admin-ink">
                        {form.ruleType === "FIXED" ? t("form.fixedValue") : t("form.percentValue")}
                      </span>
                      <input
                        data-sale-field="rule"
                        inputMode="numeric"
                        className={`${inputClass} ${shows("rule") ? "border-admin-danger" : "border-admin-border"}`}
                        value={form.ruleValue}
                        onChange={(event) => update({ ruleValue: event.target.value }, "rule")}
                        placeholder={form.ruleType === "FIXED" ? t("form.fixedPlaceholder") : t("form.percentPlaceholder")}
                        aria-invalid={shows("rule")}
                        aria-describedby="sale-rule-hint"
                      />
                      <span id="sale-rule-hint" className={`text-xs ${shows("rule") ? "text-admin-danger" : "text-admin-muted"}`}>
                        {shows("rule")
                          ? form.ruleType === "FIXED" ? t("form.errors.ruleFixed") : t("form.errors.rulePercent")
                          : form.ruleType === "FIXED" ? t("form.fixedHint") : t("form.percentHint")}
                      </span>
                    </label>
                  </Section>

                  <Section step={3} title={t("form.appliesTo")}>
                    <SaleScopeFields
                      kind="designs"
                      value={form.designs}
                      onChange={(designs) => update({ designs }, "scope")}
                      groups={tierGroups}
                      items={designTargets}
                      groupsStatus={status.tiers}
                      itemsStatus={status.designs}
                    />
                    <SaleScopeFields
                      kind="services"
                      value={form.services}
                      onChange={(services) => update({ services }, "scope")}
                      groups={categoryGroups}
                      items={serviceTargets}
                      groupsStatus={status.categories}
                      itemsStatus={status.services}
                    />
                    {shows("scope") ? (
                      <p data-sale-field="scope" tabIndex={-1} role="alert" className="text-xs text-admin-danger focus:outline-none">
                        {t("form.errors.scope")}
                      </p>
                    ) : null}
                  </Section>
                </div>

                <SalePreview form={form} designTargets={designTargets} serviceTargets={serviceTargets} status={status.preview} />
                {error ? (
                  <div data-sale-field="general" className="flex flex-wrap items-center gap-3 lg:col-span-2">
                    <p role="alert" className="text-sm text-admin-danger">{error}</p>
                    {conflict ? (
                      <Button variant="secondary" size="sm" className="rounded-lg" onPress={onReload}>{t("form.reload")}</Button>
                    ) : null}
                  </div>
                ) : confirmingDeep ? (
                  <p data-sale-field="general" role="alert" className="flex gap-2 rounded-lg border border-admin-warning/40 bg-admin-surface px-3 py-2 text-sm leading-5 text-admin-ink lg:col-span-2">
                    <ExclamationTriangleIcon aria-hidden className="size-5 shrink-0 text-admin-warning" />
                    {t("form.deepConfirm", { count: deep })}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex flex-col gap-3 border-t border-admin-border bg-admin-surface px-5 py-3 sm:flex-row sm:items-end sm:justify-between">
                <SaleSummary form={form} designs={designTargets} services={serviceTargets} status={status.preview} />
                <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto">
                  <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("form.cancel")}</Button>
                  <Button type="submit" variant="primary" className="rounded-lg" isDisabled={busy}>
                    {busy ? t("form.saving") : confirmingDeep ? t("form.deepSave") : sale ? t("form.save") : t("form.create")}
                  </Button>
                </div>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
