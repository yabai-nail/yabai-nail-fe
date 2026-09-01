import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@heroui/react", () => ({
  Toast: { Provider: "section" },
}));
import { AppToastProvider } from "./component";

describe("AppToastProvider", () => {
  it("renders the globally styled toast region", () => {
    const markup = renderToStaticMarkup(<AppToastProvider />);

    expect(markup).toContain("app-toast-region");
    expect(markup).toContain('placement="top end"');
  });
});
