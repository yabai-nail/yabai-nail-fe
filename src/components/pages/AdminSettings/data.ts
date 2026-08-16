export type CommissionPolicy = {
  readonly id: string;
  readonly staffId: string;
  readonly name: string;
  readonly initials: string;
  readonly role?: "manager";
  readonly status: "working" | "leave";
  readonly rate: number;
  readonly previousRate?: number;
  readonly effectiveFrom: string;
  readonly personalRevenue: number;
};

export const commissionPolicies: ReadonlyArray<CommissionPolicy> = [
  { id: "cp1", staffId: "s1", name: "Mai Linh", initials: "ML", role: "manager", status: "working", rate: 50, previousRate: 40, effectiveFrom: "01/05/2025", personalRevenue: 28740000 },
  { id: "cp2", staffId: "s2", name: "Thảo Vy", initials: "TV", status: "working", rate: 45, previousRate: 40, effectiveFrom: "01/05/2025", personalRevenue: 23480000 },
  { id: "cp3", staffId: "s3", name: "Quỳnh Anh", initials: "QA", status: "working", rate: 40, effectiveFrom: "01/05/2025", personalRevenue: 19860000 },
  { id: "cp4", staffId: "s4", name: "Bảo Ngọc", initials: "BN", status: "leave", rate: 50, effectiveFrom: "01/05/2025", personalRevenue: 14370000 },
];

export const commissionHistory = [
  { id: "ch1", name: "Mai Linh", from: 40, to: 50, date: "01/05/2025" },
  { id: "ch2", name: "Thảo Vy", from: 40, to: 45, date: "01/05/2025" },
  { id: "ch3", name: "Mai Linh", from: 50, to: 40, date: "01/04/2025" },
] as const;
