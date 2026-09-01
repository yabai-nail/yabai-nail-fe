import { beforeEach, describe, expect, it, vi } from "vitest";

const { success } = vi.hoisted(() => ({ success: vi.fn() }));

vi.mock("@heroui/react", () => ({
  toast: { success },
}));

import { notifySuccess } from "./app-toast";

describe("notifySuccess", () => {
  beforeEach(() => {
    success.mockClear();
  });

  it("shows a consistently timed success toast", () => {
    notifySuccess("Đã thêm nhân viên", "Thông tin mới đã được lưu.");

    expect(success).toHaveBeenCalledWith("Đã thêm nhân viên", {
      description: "Thông tin mới đã được lưu.",
      timeout: 3_500,
    });
  });

  it("omits an empty description", () => {
    notifySuccess("Đã cập nhật dịch vụ");

    expect(success).toHaveBeenCalledWith("Đã cập nhật dịch vụ", {
      timeout: 3_500,
    });
  });
});
