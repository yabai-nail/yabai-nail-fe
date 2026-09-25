"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { ArrowUpTrayIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import type { AvatarFieldState } from "@/components/blocks/admin/AdminAvatarField";

// The branch photo picker: a landscape preview plus pick / replace / remove controls. State and
// upload come from `useAvatarField` (same validate-on-pick, upload-on-save contract); only the
// shape and copy differ from the circular avatar picker.
export function BranchImageField({
  field,
  name,
  busy = false,
}: Readonly<{
  field: AvatarFieldState;
  /** Used for the image alt text. */
  name: string;
  busy?: boolean;
}>) {
  const t = useTranslations("admin.branches.image");
  const displayUrl =
    field.mode === "replace" ? field.previewUrl : field.mode === "keep" ? field.currentUrl : null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-soft p-4 sm:flex-row sm:items-center">
      <div className="grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-lg border border-admin-border bg-admin-surface sm:w-40">
        {/* The API media endpoint is public and a blob preview cannot use the Next optimizer,
            so a plain img covers both. */}
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={t("alt", { name })} className="size-full object-cover" />
        ) : (
          <BuildingStorefrontIcon aria-hidden className="size-10 text-admin-muted" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-admin-ink">{t("title")}</p>
          <p className="text-xs text-admin-muted">{t("requirements")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-xs font-semibold text-admin-accent hover:bg-admin-soft focus-within:ring-2 focus-within:ring-admin-accent">
            <ArrowUpTrayIcon aria-hidden className="size-4" />
            {displayUrl ? t("replace") : t("pick")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                field.select(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </label>
          {field.mode === "replace" && field.file ? (
            <Button size="sm" variant="ghost" className="rounded-lg" isDisabled={busy} onPress={field.clearReplacement}>
              {t("cancel")}
            </Button>
          ) : field.mode === "keep" && field.currentUrl ? (
            <Button size="sm" variant="ghost" className="rounded-lg text-admin-danger" isDisabled={busy} onPress={field.remove}>
              {t("remove")}
            </Button>
          ) : field.mode === "remove" ? (
            <span className="inline-flex items-center gap-2 text-xs text-admin-danger">
              {t("removalPending")}
              <button
                type="button"
                className="font-semibold text-admin-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                onClick={field.undoRemove}
                disabled={busy}
              >
                {t("undo")}
              </button>
            </span>
          ) : null}
        </div>
        {field.error ? <span role="alert" className="text-xs text-admin-danger">{t(`errors.${field.error}`)}</span> : null}
      </div>
    </section>
  );
}
