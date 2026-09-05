// Chart theming for the admin console.
//
// Every colour is a CSS custom property, not a hex literal, so a chart follows
// the same `--admin-*` tokens as the rest of the console and switches with the
// light/dark theme on its own. Recharts renders SVG, so `fill`/`stroke` resolve
// the cascaded variable at paint time — no JS theme wiring, no re-render on a
// theme change. The one place this matters most is the tooltip: Recharts paints
// it as a white box with hard-coded inline styles, which is unreadable in dark
// mode until `contentStyle` overrides it with surface tokens. The tooltip stays
// inside the chart's own subtree (unlike HeroUI's portalled overlays), so the
// variables resolve against the admin shell correctly.

/** Categorical series colours, in the order slices/bars should take them. */
export const CHART_SERIES = [
  "var(--admin-accent)",
  "var(--admin-info)",
  "var(--admin-violet)",
  "var(--admin-success)",
  "var(--admin-warning)",
] as const;

export const CHART_GRID = "var(--admin-border)";
export const CHART_AXIS = "var(--admin-muted)";

/** Passed to Recharts `<Tooltip contentStyle>` so it reads on any theme. */
export const CHART_TOOLTIP_STYLE = {
  background: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "0.5rem",
  color: "var(--admin-ink)",
  fontSize: "0.75rem",
  boxShadow: "var(--overlay-shadow, 0 8px 24px rgb(0 0 0 / 20%))",
} as const;

/** Matches the text colour of the tooltip's rows to the shell ink token. */
export const CHART_TOOLTIP_ITEM_STYLE = { color: "var(--admin-ink)" } as const;
export const CHART_TOOLTIP_LABEL_STYLE = { color: "var(--admin-muted)" } as const;

export const adminChartPaletteMeta = { world: "pure", domain: "admin-charts" } as const;
