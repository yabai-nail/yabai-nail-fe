import { expect, it } from "vitest";
import type { Translator } from "@/i18n/config";
import type { AdminServiceItem } from "@/service/admin/types";
import { bookedServices } from "./booked-services";

const t = ((key: string) => key) as Translator;
const booking = {
  serviceIds: ["base", "addon"], startsAt: "2026-09-27T00:00:00Z", endsAt: "2026-09-27T01:20:00Z",
  services: [
    { serviceId: "addon", serviceName: "Booked addon", unitPrice: 700, durationMinutes: 30, sortOrder: 1 },
    { serviceId: "base", serviceName: "Booked base", unitPrice: 5500, durationMinutes: 50, sortOrder: 0 },
  ],
};
const catalog = new Map<string, AdminServiceItem>([["addon", { id: "addon", name: "Changed addon", price: 500, durationMinutes: 20 } as AdminServiceItem]]);
it("uses frozen branch override/name/price/duration in stored order and full reserved duration", () => {
  const result = bookedServices(booking, catalog, t);
  expect(result.services).toEqual([
    { id: "base", name: "Booked base", unitPrice: 5500, durationMinutes: 50 },
    { id: "addon", name: "Booked addon", unitPrice: 700, durationMinutes: 30 },
  ]);
  expect(result.service).toMatchObject({ id: "base", durationMinutes: 80 });
});
it("legacy catalog fallback never shrinks the stored appointment interval", () => {
  const result = bookedServices({ ...booking, services: [] }, catalog, t);
  expect(result.services[1]).toMatchObject({ durationMinutes: 20, unitPrice: 500 });
  expect(result.service.durationMinutes).toBe(80);
});
