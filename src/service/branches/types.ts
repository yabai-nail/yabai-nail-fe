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
