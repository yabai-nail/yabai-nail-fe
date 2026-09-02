"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { ApiClientError, useAuth } from "@/service";

const PHONE_ID = "admin-login-phone";
const PASSWORD_ID = "admin-login-password";
const ERROR_ID = "admin-login-error";

const FIELD_CLASS =
  "min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-10 text-sm text-admin-ink outline-none transition-colors placeholder:text-admin-muted focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:cursor-wait disabled:opacity-60";

/**
 * The translator is a parameter rather than a hook call: this stays a plain function
 * outside the component. A server-supplied message is passed through untranslated --
 * the backend writes those, and re-wording them here would hide what it actually said.
 */
function messageFor(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiClientError) {
    if (error.code === "INVALID_CREDENTIALS") return t("errors.invalidCredentials");
    if (error.code === "NETWORK_ERROR") return t("errors.network");
    return error.message;
  }
  return t("errors.generic");
}

/**
 * Full-page sign-in for the admin console. Rendered by `AdminAuthGate` in
 * place of the shell, so signing in returns the admin to the page they were
 * trying to reach instead of dumping them on the dashboard.
 */
export function AdminLogin() {
  const t = useTranslations("admin.login");
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password") ?? ""),
      });
    } catch (caught) {
      setError(messageFor(caught, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-shell grid min-h-screen place-items-center bg-admin-canvas px-4 py-10 text-admin-ink">
      <main className="w-full max-w-sm rounded-xl border border-admin-border bg-admin-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <BrandMark className="size-12" />
          <span className="leading-none">
            <span className="font-display block text-lg font-semibold tracking-[0.16em] text-admin-ink">
              YABAI
            </span>
            <span className="mt-1 block text-[0.625rem] font-bold tracking-[0.2em] text-admin-accent">
              NAIL ATELIER
            </span>
          </span>
        </div>
        <h1 className="mt-5 text-xl font-bold text-admin-ink">{t("heading")}</h1>
        <p className="mt-1 text-sm leading-6 text-admin-muted">
          {t("subheading")}
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit} aria-busy={isSubmitting}>
          <div>
            <label
              htmlFor={PHONE_ID}
              className="mb-2 block text-sm font-semibold text-admin-ink"
            >
              {t("phone")}
            </label>
            <div className="relative">
              <PhoneIcon
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-admin-muted"
              />
              <input
                id={PHONE_ID}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="username"
                required
                placeholder="0900000000"
                disabled={isSubmitting}
                aria-describedby={error ? ERROR_ID : undefined}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={PASSWORD_ID}
              className="mb-2 block text-sm font-semibold text-admin-ink"
            >
              {t("password")}
            </label>
            <div className="relative">
              <LockClosedIcon
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-admin-muted"
              />
              <input
                id={PASSWORD_ID}
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder={t("passwordPlaceholder")}
                disabled={isSubmitting}
                aria-describedby={error ? ERROR_ID : undefined}
                className={`${FIELD_CLASS} pr-12`}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? t("hidePassword") : t("showPassword")}
                className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-admin-muted transition-colors hover:text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
              >
                {isPasswordVisible ? (
                  <EyeSlashIcon aria-hidden="true" className="size-5" />
                ) : (
                  <EyeIcon aria-hidden="true" className="size-5" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <p
              id={ERROR_ID}
              role="alert"
              className="rounded-lg bg-danger/10 px-3 py-2 text-xs leading-5 text-danger"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isDisabled={isSubmitting}
            className="rounded-lg"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-admin-muted">
          {t("footnote")}
        </p>
      </main>
    </div>
  );
}

export const adminLoginMeta = { world: "connected", domain: "auth" } as const;
