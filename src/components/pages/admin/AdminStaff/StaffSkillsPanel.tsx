"use client";

import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  adminService,
  useAdminServices,
  useStaffSkills,
} from "@/service";

// Reads the org service catalog and the staff's current skill grants,
// merges them into a checkbox list, and PUTs the whole set.
export function StaffSkillsPanel({
  staffId,
  staffVersion,
}: Readonly<{ staffId: string; staffVersion?: number }>) {
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
      await adminService.setStaffSkills(
        staffId,
        { skills: [...currentSet].map((skillId) => ({ skillId })) },
        // The skill set carries its own version; the staff member's is a
        // different resource and would fail the optimistic check.
        skills.data?.version ?? staffVersion,
      );
      setSelected(null);
      void skills.mutate();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không lưu được kỹ năng.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="staff-skills-heading" className="space-y-2 border-t border-admin-border pt-4">
      <h3 id="staff-skills-heading" className="text-sm font-bold text-admin-ink">Kỹ năng</h3>

      {services.isLoading || skills.isLoading ? (
        <p className="text-xs text-admin-muted">Đang tải…</p>
      ) : services.error ? (
        <p role="alert" className="text-xs text-admin-danger">Không tải được danh mục dịch vụ.</p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-admin-border p-2 text-xs">
          {(services.data?.items ?? []).map((service) => (
            <li key={service.id}>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox" className="accent-admin-accent"
                  checked={currentSet.has(service.id)}
                  onChange={() => toggle(service.id)}
                />
                <span className="flex-1 truncate text-admin-ink">{service.name}</span>
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
          isDisabled={!dirty || busy}
        >
          {busy ? "Đang lưu…" : "Lưu kỹ năng"}
        </Button>
      </div>
      {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
    </section>
  );
}
