import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NailDesignCard } from "./NailDesignCard";

describe("public nail-design card", () => {
  it("renders the current production response name, public image and price overlay", () => {
    const markup = renderToStaticMarkup(
      <NailDesignCard
        design={{
          id: "design-1",
          localizedName: "Hoa anh đào",
          nameVi: "Hoa anh đào",
          title: "Hoa anh đào",
          thumbnailUrl: "https://api.example.test/api/v1/media/media-1/public-content",
          images: ["https://api.example.test/api/v1/media/media-1/public-content"],
          indicativePrice: 10_980,
        }}
      />,
    );

    expect(markup).toContain("Hoa anh đào");
    expect(markup).toContain("https://api.example.test/api/v1/media/media-1/public-content");
    expect(markup).toContain("¥10.980");
    expect(markup).toContain("absolute inset-x-0 bottom-0");
    expect(markup).not.toContain("YABAI</div>");
  });

  it("falls back across legacy fields without rendering an invalid price", () => {
    const markup = renderToStaticMarkup(
      <NailDesignCard design={{ id: "legacy", name: "Legacy", imageUrl: "/legacy.webp", indicativePrice: -1 }} />,
    );

    expect(markup).toContain("Legacy");
    expect(markup).toContain("/legacy.webp");
    expect(markup).not.toContain("¥");
  });
});

