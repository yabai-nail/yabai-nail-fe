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
  readonly priceVnd: number;
  readonly durationMinutes: number;
  readonly active: boolean;
  readonly [field: string]: unknown;
}

export interface BranchStaff {
  readonly id: string;
  readonly branchId: string;
  readonly displayName: string;
  readonly serviceIds?: ReadonlyArray<string>;
  readonly rating?: number;
  readonly [field: string]: unknown;
}
