import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/service";

import { canCreateStaff, OPEN_APPOINTMENTS_CODE, staffSaveErrorKey } from "./data";

describe("canCreateStaff", () => {
  const complete = {
    name: "Mai Linh",
    withAccount: true,
    phone: "0900000010",
    password: "NewPass1",
  } as const;

  it("wants a name whether or not a login comes with it", () => {
    expect(canCreateStaff({ ...complete, name: "M" })).toBe(false);
    expect(canCreateStaff({ ...complete, name: "M", withAccount: false })).toBe(false);
  });

  // A technician who never opens the console still belongs on the roster.
  it("asks for credentials only when a login is being issued", () => {
    expect(canCreateStaff({ name: "Mai Linh", withAccount: false, phone: "", password: "" })).toBe(true);
    expect(canCreateStaff(complete)).toBe(true);
  });

  // Both requests go out on one press, so a credential the backend would refuse has to stop
  // the form here rather than after the account call has already landed.
  it("holds the form back on a credential the backend would refuse", () => {
    expect(canCreateStaff({ ...complete, phone: "900000010" })).toBe(false);
    expect(canCreateStaff({ ...complete, password: "newpass1" })).toBe(false);
  });
});

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
