import { describe, expect, it } from "vitest";
import { resolutionInput } from "./component";

describe("check-in input classification", () => {
  it.each(["09012345678", "08012345678", "0312345678", "0901234567", "+819012345678", "+84901234567"])("routes %s as a phone", (phone) => {
    expect(resolutionInput(phone)).toEqual({ phone });
  });
  it("trims whitespace around a phone", () => {
    expect(resolutionInput(" 09012345678 ")).toEqual({ phone: "09012345678" });
  });
  it("preserves the signed membership QR", () => {
    expect(resolutionInput("eyJhbGci.eyJzdWI.signature")).toEqual({ qrPayload: "eyJhbGci.eyJzdWI.signature" });
  });
});
