import { describe, expect, it } from "vitest";

import {
  apiOperations,
  buildOperationPath,
  compatibilityApiOperations,
  featureApiOperations,
  getApiOperation,
  runtimeApiOperations,
} from "./operations";

const expectedFeatureOperationIds = [
  "GET /api/v1/admin/auth/session",
  "GET /api/v1/admin/branches/{branchId}/conversations",
  "GET /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages",
  "POST /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages",
  "PATCH /api/v1/admin/branches/{branchId}/conversations/{conversationId}",
  "GET /api/v1/admin/branches/{branchId}/staff-performance",
  "GET /api/v1/admin/branches/{branchId}/settings",
  "PATCH /api/v1/admin/branches/{branchId}/settings",
] as const;

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
    expect(featureApiOperations.map(({ id }) => id)).toEqual(
      expectedFeatureOperationIds,
    );
    for (const operation of featureApiOperations) {
      expect(operation).toMatchObject({
        audience: "app",
        stability: "feature",
      });
    }
    expect(runtimeApiOperations).toHaveLength(191);
    expect(
      new Set(runtimeApiOperations.map(({ id }) => id)).size,
    ).toBe(191);
    expect(runtimeApiOperations.filter(({ audience }) => audience === "app")).toHaveLength(182);
    expect(runtimeApiOperations.filter(({ audience }) => audience !== "app")).toHaveLength(9);
    for (const operation of runtimeApiOperations) {
      expect(getApiOperation(operation.id)).toBe(operation);
    }
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

  it("does not expose any provider or internal route as a browser request path", () => {
    const serverOnlyOperations = runtimeApiOperations.filter(
      ({ audience }) => audience !== "app",
    );

    expect(serverOnlyOperations).toHaveLength(9);
    for (const operation of serverOnlyOperations) {
      expect(() => buildOperationPath(operation)).toThrow(/server-only/i);
    }
  });
});
