import { DEFAULT_TIME_ZONE } from "@/i18n/config";

import type { BranchRow } from "./data";

/** New Japanese branches default to Tokyo; existing branches keep their stored zone. */
export function initialBranchTimeZone(branch: Pick<BranchRow, "timezone"> | null): string {
  return branch?.timezone ?? DEFAULT_TIME_ZONE;
}
