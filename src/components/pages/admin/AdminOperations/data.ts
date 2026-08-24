import type { AdminCustomer } from "@/service";

export type CustomerHit = {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
};

/** Strips grouping characters so "1.000.000" or "1,000,000" become the integer amount. */
export function parseVnd(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function summarizeCustomer(customer: AdminCustomer): CustomerHit {
  const record = customer as unknown as Record<string, unknown>;
  const name = typeof record.displayName === "string" ? record.displayName : "—";
  const phone =
    typeof record.phoneMasked === "string"
      ? record.phoneMasked
      : typeof record.phone === "string"
        ? record.phone
        : "—";
  return { id: customer.id, name, phone };
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}
