import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/service";

import { OPEN_APPOINTMENTS_CODE, staffSaveErrorKey } from "./data";

describe("staffSaveErrorKey", () => {
  it("names the one refusal the admin can do something about", () => {
    const refused = new ApiClientError({
      message: "Khong the ngung hoac chuyen nhan vien khi con lich hen chua hoan tat.",
      code: OPEN_APPOINTMENTS_CODE,
      status: 409,
    });

    expect(staffSaveErrorKey(refused)).toBe("openAppointments");
  });

  // Every other failure already arrives with a Vietnamese sentence from the backend, and
  // replacing it with a generic one would hide which rule was broken.
  it("leaves every other failure to the message the server sent", () => {
    expect(staffSaveErrorKey(new ApiClientError({ message: "Sai phien ban.", code: "VERSION_CONFLICT" }))).toBeNull();
    expect(staffSaveErrorKey(new Error("boom"))).toBeNull();
    expect(staffSaveErrorKey(null)).toBeNull();
    expect(staffSaveErrorKey("RESOURCE_HAS_OPEN_APPOINTMENTS")).toBeNull();
  });
});
