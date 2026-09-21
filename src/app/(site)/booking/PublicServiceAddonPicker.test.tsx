import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { BranchServiceAddonGroup } from "@/service";

import { PublicServiceAddonPicker } from "./PublicServiceAddonPicker";

const groups: ReadonlyArray<BranchServiceAddonGroup> = [
  {
    code: "finish",
    nameVi: "Lớp phủ",
    selectionMode: "SINGLE",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    options: [
      {
        id: "gloss",
        serviceId: "gloss",
        code: "GLOSS",
        name: "Phủ bóng",
        price: 1500,
        durationMinutes: 20,
        available: true,
      },
      {
        id: "matt",
        serviceId: "matt",
        code: "MATT",
        name: "Phủ lì",
        price: 900,
        durationMinutes: 10,
        available: false,
        unavailableReason: "NO_ELIGIBLE_STAFF",
      },
    ],
  },
];

describe("PublicServiceAddonPicker", () => {
  it("shows effective price/duration and disables unavailable options", () => {
    const markup = renderToStaticMarkup(
      <PublicServiceAddonPicker groups={groups} selectedOptionIds={[]} onToggle={vi.fn()} />,
    );

    expect(markup).toContain("Lớp phủ");
    expect(markup).toContain("Phủ bóng");
    expect(markup).toContain("¥1.500 · 20 phút");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*Phủ lì/);
    expect(markup).toContain("Hiện không khả dụng");
    expect(markup).toContain("Vui lòng chọn ít nhất 1 tùy chọn.");
  });
});
