import type { BranchServiceAddonGroup, CreateAppointmentInput } from "@/service";

export interface PublicAddonSelectionSummary {
  readonly selectedServiceIds: ReadonlyArray<string>;
  readonly addedPrice: number;
  readonly addedMinutes: number;
  readonly complete: boolean;
}

export function minimumSelections(group: BranchServiceAddonGroup): number {
  return group.required ? Math.max(1, group.minSelections) : group.minSelections;
}

function selectedAvailableOptions(
  groups: ReadonlyArray<BranchServiceAddonGroup>,
  selectedOptionIds: ReadonlyArray<string>,
) {
  const selected = new Set(selectedOptionIds);
  return groups.flatMap((group) =>
    group.options.filter((option) => selected.has(option.id) && option.available),
  );
}

export function summarisePublicAddonSelection(
  groups: ReadonlyArray<BranchServiceAddonGroup>,
  selectedOptionIds: ReadonlyArray<string>,
): PublicAddonSelectionSummary {
  const selected = new Set(selectedOptionIds);
  const chosen = selectedAvailableOptions(groups, selectedOptionIds);
  const complete = groups.every((group) => {
    const count = group.options.filter(
      (option) => option.available && selected.has(option.id),
    ).length;
    return count >= minimumSelections(group) && count <= group.maxSelections;
  });

  return {
    selectedServiceIds: chosen.flatMap((option) =>
      option.serviceId ? [option.serviceId] : [],
    ),
    addedPrice: chosen.reduce((sum, option) => sum + option.price, 0),
    addedMinutes: chosen.reduce((sum, option) => sum + option.durationMinutes, 0),
    complete,
  };
}

export function togglePublicAddonSelection(
  groups: ReadonlyArray<BranchServiceAddonGroup>,
  groupCode: string,
  optionId: string,
  selectedOptionIds: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const group = groups.find((candidate) => candidate.code === groupCode);
  const option = group?.options.find((candidate) => candidate.id === optionId);
  if (!group || !option?.available) return selectedOptionIds;

  const groupIds = new Set(group.options.map((candidate) => candidate.id));
  const outsideGroup = selectedOptionIds.filter((id) => !groupIds.has(id));
  const selectedInGroup = selectedOptionIds.filter((id) => groupIds.has(id));
  const active = selectedInGroup.includes(optionId);

  if (active) return [...outsideGroup, ...selectedInGroup.filter((id) => id !== optionId)];

  const isNoSelection = option.serviceId === null || option.representsNoSelection === true;
  if (group.selectionMode === "SINGLE" || isNoSelection) {
    return [...outsideGroup, optionId];
  }

  const withoutNoSelection = selectedInGroup.filter((id) => {
    const candidate = group.options.find((item) => item.id === id);
    return candidate?.serviceId !== null && candidate?.representsNoSelection !== true;
  });
  if (withoutNoSelection.length >= group.maxSelections) return selectedOptionIds;
  return [...outsideGroup, ...withoutNoSelection, optionId];
}

export function buildPublicAppointmentInput(
  baseServiceId: string,
  addonServiceIds: ReadonlyArray<string>,
  input: Readonly<{
    branchId: string;
    staffId?: string | null;
    startsAt: string;
    note?: string;
    couponCode?: string;
    customer?: Readonly<Record<string, unknown>>;
  }>,
): CreateAppointmentInput {
  return { ...input, serviceIds: [baseServiceId, ...addonServiceIds] };
}
