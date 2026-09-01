"use client";

import { Card, Radio, RadioGroup } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";

/**
 * Each language names itself. An endonym needs no translation and stays right in
 * every catalogue, which is also how a reader who cannot read the current locale
 * finds their way out.
 */
const LANGUAGE_NAMES: Record<Locale, string> = {
  vi: "Tiếng Việt", // i18n-check: allow endonym — a language names itself, identically in every catalogue
  ja: "日本語",
  en: "English",
};

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSettings() {
  const t = useTranslations("admin.settings.language");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // `onChange`, and `value` always a string -- useLocale() cannot answer undefined.
  // PaymentMethodPicker documents what undefined costs here: react-aria switches to
  // uncontrolled mode and keeps a selection of its own that drifts from the truth.
  const select = (next: string) => {
    if (next === locale) return;
    // The server layout reads this cookie, so writing it and refreshing is what
    // swaps the catalogue. SameSite=Lax because nothing cross-site sets it, and no
    // Secure flag so it keeps working on http://localhost during development.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    // refresh() re-runs the admin layout on the server; without it the cookie is
    // set but the page keeps rendering the catalogue it was built with.
    startTransition(() => router.refresh());
  };

  return (
    <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Content className="p-6">
        <h2 className="font-bold text-admin-ink">{t("heading")}</h2>
        <p className="mt-2 text-sm text-admin-muted">{t("description")}</p>

        <RadioGroup
          aria-label={t("legend")}
          className="mt-5 gap-3"
          isDisabled={pending}
          value={locale}
          onChange={select}
        >
          {LOCALES.map((option) => (
            <Radio
              key={option}
              value={option}
              className="rounded-lg border border-admin-border px-4 py-3 text-admin-muted data-[selected=true]:border-admin-accent data-[selected=true]:bg-admin-soft data-[selected=true]:text-admin-accent"
            >
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Radio.Content className="text-sm font-semibold">
                {LANGUAGE_NAMES[option]}
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>

        <p aria-live="polite" className="mt-4 h-5 text-xs text-admin-muted">
          {pending ? t("pending") : ""}
        </p>
      </Card.Content>
    </Card>
  );
}
