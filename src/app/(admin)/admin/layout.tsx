import type { ReactNode } from "react";
import { AdminAuthGate } from "@/components/layouts/AdminAuthGate";
import { AdminIntlProvider } from "@/components/layouts/AdminIntlProvider";
import { AdminShell } from "@/components/layouts/AdminShell";
import { getMessages } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/locale";
import { AdminBranchProvider } from "@/service";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Read here rather than in the root layout: cookies() opts a route out of static
  // rendering, and doing it at the root would take the five public pages down with
  // the console. See docs/specs/SPEC-admin-i18n.md section 4.
  const locale = await resolveLocale();
  const messages = await getMessages(locale);

  // The gate is outermost among the console's own providers: no branch context and
  // no shell chrome should exist for a visitor who has not signed in. The locale
  // sits above it so the gate's own copy can be translated too.
  return (
    <AdminIntlProvider locale={locale} messages={messages}>
      <AdminAuthGate>
        <AdminBranchProvider>
          <AdminShell>{children}</AdminShell>
        </AdminBranchProvider>
      </AdminAuthGate>
    </AdminIntlProvider>
  );
}
