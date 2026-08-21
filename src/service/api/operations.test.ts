import { describe, expect, it } from "vitest";

import {
  apiOperations,
  buildOperationPath,
  compatibilityApiOperations,
  getApiOperation,
  runtimeApiOperations,
} from "./operations";

describe("backend API operation catalog", () => {
  it("maps all 164 canonical backend operations without duplicates", () => {
    expect(apiOperations).toHaveLength(164);
    const keys = apiOperations.map(({ method, path }) => `${method} ${path}`);
    expect(new Set(keys).size).toBe(164);
  });

  it("classifies browser and server-only operations", () => {
    expect(apiOperations.filter(({ audience }) => audience === "app")).toHaveLength(159);
    expect(apiOperations.filter(({ audience }) => audience !== "app")).toHaveLength(5);
  });

  it("also inventories concrete compatibility controllers exposed at runtime", () => {
    expect(compatibilityApiOperations).toHaveLength(19);
    expect(runtimeApiOperations).toHaveLength(183);
    expect(
      new Set(runtimeApiOperations.map(({ id }) => id)).size,
    ).toBe(183);
    expect(runtimeApiOperations.filter(({ audience }) => audience === "app")).toHaveLength(174);
  });

  it("resolves and safely encodes route parameters", () => {
    const operation = getApiOperation(
      "GET /api/v1/admin/branches/{branchId}/customers/{customerId}",
    );

    expect(
      buildOperationPath(operation, {
        branchId: "branch/one",
        customerId: "customer two",
      }),
    ).toBe("/admin/branches/branch%2Fone/customers/customer%20two");
  });

  it("rejects missing or unknown path parameters", () => {
    const operation = getApiOperation("GET /api/v1/branches/{branchId}");

    expect(() => buildOperationPath(operation)).toThrow(/branchId/);
    expect(() =>
      buildOperationPath(operation, { branchId: "one", typo: "two" }),
    ).toThrow(/typo/);
  });

  it("does not expose internal routes as browser request paths", () => {
    const operation = getApiOperation(
      "POST /internal/v1/integrations/push/messages",
    );

    expect(() => buildOperationPath(operation)).toThrow(/server-only/i);
  });
});
