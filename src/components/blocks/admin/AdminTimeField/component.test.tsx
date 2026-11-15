import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@heroui/react", () => {
  const part = ({ children }: { children?: ReactNode }) => createElement("div", null, children);
  return { Button: part, Popover: Object.assign(part, { Content: part, Dialog: part }) };
});
import { AdminTimeField } from "./component";
describe("AdminTimeField", () => {
  it("allows minute-precision typing alongside the picker when editable", () => {
    const html = renderToStaticMarkup(createElement(AdminTimeField, { value: "09:23", onChange: () => {}, ariaLabel: "Start time", editable: true }));
    expect(html).toContain('type="time"');
    expect(html).toContain('step="60"');
    expect(html).toContain('value="09:23"');
    expect(html).toContain('aria-label="Start time"');
    expect(html).toContain('09:15');
  });
  it("preserves picker-only fields by default", () => {
    const html = renderToStaticMarkup(createElement(AdminTimeField, { value: "09:00", onChange: () => {} }));
    expect(html).not.toContain('type="time"');
  });
});
