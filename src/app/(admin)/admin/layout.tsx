import type { ReactNode } from "react";
import { AdminAuthGate } from "@/components/layouts/AdminAuthGate";
import { AdminIntlProvider } from "@/components/layouts/AdminIntlProvider";
import { AdminShell } from "@/components/layouts/AdminShell";
import { getMessages } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/locale";
import { AdminBranchProvider, AuthProvider } from "@/service";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Read here rather than in the root layout: cookies() opts a route out of static
  // rendering, and doing it at the root would take the five public pages down with
  // the console. See docs/specs/SPEC-admin-i18n.md section 4.
  const locale = await resolveLocale();
  const messages = await getMessages(locale);

  // Keep AuthProvider inside the admin route tree. Mounting it at the app root makes
  // every public tab rotate the admin refresh token from shared localStorage; an
  // already-open admin tab can then reuse the spent token and revoke the family.
  // The gate stays outside branch/shell state so anonymous visitors boot neither.
  return (
    <AdminIntlProvider locale={locale} messages={messages}>
      <AuthProvider>
        <AdminAuthGate>
          <AdminBranchProvider>
            <AdminShell>{children}</AdminShell>
          </AdminBranchProvider>
        </AdminAuthGate>
      </AuthProvider>
    </AdminIntlProvider>
  );
}
