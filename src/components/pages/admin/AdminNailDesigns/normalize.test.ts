import { describe, expect, it } from "vitest";

import type { AdminNailDesign } from "@/service";
import {
  collectStatuses,
  formatDateTime,
  isPendingRow,
  isProposalRow,
  matchesQuery,
  statusLabel,
  toDesignRow,
  type DesignRow,
} from "./normalize";

const asDesign = (record: Record<string, unknown>) => record as unknown as AdminNailDesign;

describe("toDesignRow", () => {
  it("reads the fields the public catalogue already commits to", () => {
    const row = toDesignRow(
      asDesign({
        id: "d-1",
        name: "Ombré hồng phấn",
        imageUrl: "https://media.example/1.jpg",
        status: "PUBLISHED",
        style: "OMBRE",
        nailLength: "SHORT",
        createdAt: "2026-08-01T03:00:00.000Z",
        version: 3,
      }),
    );

    expect(row).toMatchObject({
      id: "d-1",
      name: "Ombré hồng phấn",
      imageUrl: "https://media.example/1.jpg",
      status: "PUBLISHED",
      style: "OMBRE",
      nailLength: "SHORT",
      version: 3,
    });
  });

  it("falls back to blank instead of inventing a value", () => {
    const row = toDesignRow(asDesign({}));

    expect(row).toEqual({
      id: "",
      name: "",
      imageUrl: "",
      status: "",
      style: "",
      nailLength: "",
      proposalId: "",
      proposedBy: "",
      createdAt: "",
    });
    expect(row.version).toBeUndefined();
  });

  it("omits version when the backend sends a non-numeric one", () => {
    expect(toDesignRow(asDesign({ version: "3" })).version).toBeUndefined();
  });

  it("falls back to thumbnailUrl when imageUrl is absent", () => {
    expect(toDesignRow(asDesign({ thumbnailUrl: "https://m/t.jpg" })).imageUrl).toBe(
      "https://m/t.jpg",
    );
  });

  it("reads a proposal id from either the flat field or a nested proposal", () => {
    expect(toDesignRow(asDesign({ proposalId: "p-1" })).proposalId).toBe("p-1");
    expect(toDesignRow(asDesign({ proposal: { id: "p-2" } })).proposalId).toBe("p-2");
  });

  it("reads the proposer and the proposal date from a nested proposal", () => {
    const row = toDesignRow(
      asDesign({ proposal: { id: "p-3", customerName: "Ngọc", createdAt: "2026-08-02T00:00:00.000Z" } }),
    );

    expect(row.proposedBy).toBe("Ngọc");
    expect(row.createdAt).toBe("2026-08-02T00:00:00.000Z");
  });

  it("survives a nested proposal that is not an object", () => {
    expect(toDesignRow(asDesign({ proposal: null })).proposalId).toBe("");
    expect(toDesignRow(asDesign({ proposal: "p-4" })).proposalId).toBe("");
  });
});

describe("proposal partitioning", () => {
  const row = (patch: Partial<DesignRow>): DesignRow => ({
    id: "d",
    name: "",
    imageUrl: "",
    status: "",
    style: "",
    nailLength: "",
    proposalId: "",
    proposedBy: "",
    createdAt: "",
    ...patch,
  });

  it("treats only rows carrying a proposal id as decidable", () => {
    expect(isProposalRow(row({ proposalId: "p-1" }))).toBe(true);
    // Pending-looking but undecidable: the decision route needs a proposal id.
    expect(isProposalRow(row({ status: "PENDING" }))).toBe(false);
  });

  it("still recognises a pending status so the count can be surfaced", () => {
    expect(isPendingRow(row({ status: "PENDING" }))).toBe(true);
    expect(isPendingRow(row({ status: "pending_review" }))).toBe(true);
    expect(isPendingRow(row({ status: "PUBLISHED" }))).toBe(false);
    expect(isPendingRow(row({ status: "" }))).toBe(false);
  });

  it("merges observed statuses with the fallbacks without duplicating", () => {
    const statuses = collectStatuses([row({ status: "PUBLISHED" }), row({ status: "LIVE" })]);

    expect(statuses).toContain("LIVE");
    expect(statuses.filter((status) => status === "PUBLISHED")).toHaveLength(1);
    expect(statuses).toEqual(expect.arrayContaining(["DRAFT", "PUBLISHED", "ARCHIVED"]));
    expect(statuses).not.toContain("");
  });

  it("matches the query against name, style and nail length", () => {
    const design = row({ name: "Ombré hồng", style: "GRADIENT", nailLength: "SHORT" });

    expect(matchesQuery(design, "")).toBe(true);
    expect(matchesQuery(design, "  ")).toBe(true);
    expect(matchesQuery(design, "ombré")).toBe(true);
    expect(matchesQuery(design, "gradient")).toBe(true);
    expect(matchesQuery(design, "short")).toBe(true);
    expect(matchesQuery(design, "almond")).toBe(false);
  });
});

describe("labels", () => {
  it("labels known statuses in Vietnamese and passes unknown ones through", () => {
    expect(statusLabel("PUBLISHED")).toBe("Đang hiển thị");
    expect(statusLabel("pending")).toBe("Chờ duyệt");
    expect(statusLabel("")).toBe("Chưa đặt trạng thái");
    expect(statusLabel("WEIRD_BACKEND_VALUE")).toBe("WEIRD_BACKEND_VALUE");
  });

  it("renders a dash rather than Invalid Date", () => {
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatDateTime("2026-08-01T03:00:00.000Z")).not.toBe("—");
  });
});
