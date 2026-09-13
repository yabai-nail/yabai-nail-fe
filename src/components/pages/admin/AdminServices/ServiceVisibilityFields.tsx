"use client";

import { useTranslations } from "next-intl";

type ServiceVisibilityFieldsProps = {
  readonly busy: boolean;
  readonly isFeatured: boolean;
  readonly isVisible: boolean;
  readonly onFeaturedChange: (value: boolean) => void;
  readonly onVisibleChange: (value: boolean) => void;
};

/** Shared settings keep create and edit behavior, wording and spacing identical. */
export function ServiceVisibilityFields({
  busy,
  isFeatured,
  isVisible,
  onFeaturedChange,
  onVisibleChange,
}: ServiceVisibilityFieldsProps) {
  const t = useTranslations("admin.services");
  const changeVisibility = (visible: boolean) => {
    onVisibleChange(visible);
    if (!visible) onFeaturedChange(false);
  };

  return (
    <fieldset className="rounded-xl border border-admin-border bg-admin-soft p-4">
      <legend className="px-1 text-sm font-bold text-admin-ink">{t("visibility.heading")}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border border-admin-border bg-admin-surface p-4 text-sm text-admin-ink transition-colors hover:border-admin-accent focus-within:ring-2 focus-within:ring-admin-accent">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-admin-accent"
            checked={isVisible}
            disabled={busy}
            onChange={(event) => changeVisibility(event.target.checked)}
          />
          <span>
            <strong className="block">{t("visibility.publicLabel")}</strong>
            <span className="mt-1 block text-xs leading-5 text-admin-muted">
              {t("visibility.publicDescription")}
            </span>
          </span>
        </label>

        <label className={`flex min-h-24 items-start gap-3 rounded-lg border border-admin-border bg-admin-surface p-4 text-sm text-admin-ink transition-colors focus-within:ring-2 focus-within:ring-admin-accent ${isVisible ? "cursor-pointer hover:border-admin-accent" : "cursor-not-allowed opacity-60"}`}>
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-admin-accent"
            checked={isFeatured}
            disabled={busy || !isVisible}
            onChange={(event) => onFeaturedChange(event.target.checked)}
          />
          <span>
            <strong className="block">{t("visibility.featuredLabel")}</strong>
            <span className="mt-1 block text-xs leading-5 text-admin-muted">
              {isVisible
                ? t("visibility.featuredDescription")
                : t("visibility.featuredRequiresPublic")}
            </span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
