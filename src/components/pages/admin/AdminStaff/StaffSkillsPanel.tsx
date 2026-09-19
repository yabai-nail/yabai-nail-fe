"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminPermission,
  useAdminServices,
  useStaffSkills,
} from "@/service";

// Reads the org service catalog and the staff's current skill grants,
// merges them into a checkbox list, and PUTs the whole set.
export function StaffSkillsPanel({
  staffId,
  staffVersion,
}: Readonly<{ staffId: string; staffVersion?: number }>) {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("admin.common");
  const canWrite = useAdminPermission("staff.skill.write.branch");
  const services = useAdminServices();
  const skills = useStaffSkills(staffId);
  const grantedIds = useMemo<Set<string>>(
    // The endpoint answers { staffId, skills, version } — not the { items }
    // envelope the rest of the admin lists use — and each entry is keyed by
    // skillId. Reading `.items` and `.serviceId` meant the granted set was
    // always empty, so a staff member's existing skills never showed as ticked
    // and saving silently dropped every one of them.
    () => new Set((skills.data?.skills ?? []).map((skill) => skill.skillId)),
    [skills.data],
  );

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const currentSet = selected ?? grantedIds;
  const dirty = selected !== null;
  // Only active services can be granted as skills — the backend rejects the whole set if any id
  // is an inactive (or unknown) service. So never list inactive ones, nor let "select all" tick them.
  const skillServices = useMemo(() => (services.data?.items ?? []).filter((service) => service.active), [services.data]);
  const allServiceIds = useMemo(() => skillServices.map((service) => service.id), [skillServices]);
  const allChecked = allServiceIds.length > 0 && allServiceIds.every((id) => currentSet.has(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    const base = new Set(currentSet);
    if (base.has(id)) base.delete(id);
    else base.add(id);
    setSelected(base);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // Only persist active services: a grant for a since-deactivated service is invisible in the
      // active-only list yet would fail the backend's active-services check and block every save.
      const activeIds = new Set(allServiceIds);
      await adminService.setStaffSkills(
        staffId,
        { skills: [...currentSet].filter((id) => activeIds.has(id)).map((skillId) => ({ skillId })) },
        // The skill set carries its own version; the staff member's is a
        // different resource and would fail the optimistic check.
        skills.data?.version ?? staffVersion,
      );
      notifySuccess(tc("skillsSaved"));
      setSelected(null);
      void skills.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("skills.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="staff-skills-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="staff-skills-heading" className="text-sm font-bold text-admin-ink">{t("skills.heading")}</h3>
        {canWrite && allServiceIds.length > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg"
            isDisabled={busy}
            onPress={() => setSelected(allChecked ? new Set() : new Set(allServiceIds))}
          >
            {allChecked ? t("skills.clearAll") : t("skills.selectAll")}
          </Button>
        ) : null}
      </div>

      {services.isLoading || skills.isLoading ? (
        <p className="text-xs text-admin-muted">{t("compensation.loading")}</p>
      ) : services.error ? (
        <p role="alert" className="text-xs text-admin-danger">{t("skills.loadFailed")}</p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-admin-border p-2 text-xs">
          {(services.data?.items ?? []).map((service) => (
            <li key={service.id}>
              <label className={`flex items-center gap-2 ${service.active ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                <input
                  type="checkbox" className="accent-admin-accent"
                  checked={currentSet.has(service.id)}
                  disabled={!canWrite || !service.active}
                  onChange={() => toggle(service.id)}
                />
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full ${service.active ? "bg-admin-success" : "bg-admin-muted"}`}
                />
                <span className="flex-1 truncate text-admin-ink">{service.name}</span>
                {service.active ? null : (
                  <span className="shrink-0 rounded-full bg-admin-soft px-1.5 py-0.5 text-[0.6rem] font-semibold text-admin-muted">{t("skills.inactive")}</span>
                )}
                {typeof service.durationMinutes === "number" ? (
                  <span className="text-[0.65rem] text-admin-muted">{service.durationMinutes}p</span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="primary"
          className="rounded-lg"
          onPress={() => void submit()}
          isDisabled={!canWrite || !dirty || busy}
        >
          {busy ? t("compensation.saving") : t("skills.submit")}
        </Button>
      </div>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    </section>
  );
}
