export interface Branch {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly timezone: string;
  readonly active: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// -- Public branch sub-resources -----------------------------------------------

export interface BranchServiceCategory {
  readonly id: string;
  readonly branchId: string;
  readonly code: string;
  readonly name: string;
  readonly nameVi?: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly sortOrder?: number;
  readonly [field: string]: unknown;
}

export interface BranchService {
  readonly id: string;
  readonly branchId: string;
  readonly categoryId?: string;
  readonly name: string;
  readonly nameJa?: string;
  readonly description?: string;
  readonly price: number;
  readonly durationMinutes: number;
  readonly active: boolean;
  readonly [field: string]: unknown;
}

export interface BranchServiceAddonOption {
  readonly id: string;
  readonly serviceId: string | null;
  readonly code: string;
  readonly name: string;
  readonly nameJa?: string | null;
  readonly imageUrl?: string | null;
  /** Branch-effective price returned by the public endpoint. */
  readonly price: number;
  /** Branch-effective duration returned by the public endpoint. */
  readonly durationMinutes: number;
  readonly representsNoSelection?: boolean;
  readonly available: boolean;
  readonly unavailableReason?: string | null;
}

export interface BranchServiceAddonGroup {
  readonly code: string;
  readonly nameVi?: string | null;
  readonly nameJa?: string | null;
  readonly selectionMode: "SINGLE" | "MULTIPLE";
  readonly required: boolean;
  readonly minSelections: number;
  readonly maxSelections: number;
  readonly options: ReadonlyArray<BranchServiceAddonOption>;
}

export interface BranchServiceAddons {
  readonly serviceId: string;
  readonly groups: ReadonlyArray<BranchServiceAddonGroup>;
}

export interface BranchStaff {
  readonly id: string;
  readonly branchId: string;
  readonly displayName: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly rating?: number;
  readonly [field: string]: unknown;
}
