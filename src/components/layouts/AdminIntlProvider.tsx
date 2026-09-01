"use client";

import { I18nProvider } from "@heroui/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

export interface AdminIntlProviderProps {
  readonly locale: string;
  readonly messages: Record<string, unknown>;
  readonly children: ReactNode;
}

/**
 * The console's locale boundary, nested inside the root providers rather than
 * replacing them.
 *
 * Both providers are client components, so they are wrapped here instead of being
 * rendered straight from the server layout — that way the layout never depends on
 * whether a package ships a "use client" directive.
 *
 * `lang` sits on this element rather than on <html>. Setting it on <html> would
 * mean reading the cookie in the root layout, which turns all 22 currently-static
 * routes dynamic, including the five public ones. `lang` is valid on any element
 * and assistive technology honours the nearest scope.
 */
export function AdminIntlProvider({ locale, messages, children }: AdminIntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <I18nProvider locale={locale}>
        <div lang={locale} className="contents">
          {children}
        </div>
      </I18nProvider>
    </NextIntlClientProvider>
  );
}
