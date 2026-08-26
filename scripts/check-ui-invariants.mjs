#!/usr/bin/env node
/**
 * Four defects that lint, the unit tests and the production build all report
 * clean, because none of them is a type error, a failing assertion or a broken
 * import. They are things the console does wrong while compiling perfectly:
 *
 *   1. a button with no handler — it renders, it is not disabled, pressing it
 *      does nothing. Sixteen of these were live at once, including the sidebar
 *      sign-out.
 *   2. a link that goes nowhere — href="" or href="#".
 *   3. demo data rendered as if it were real — a badge reading "18 unread" on a
 *      system holding zero conversations, a customer's "last appointment"
 *      hardcoded to a date in 2025.
 *   4. an alignment class fighting the design system — HeroUI sets
 *      flex-direction: column on several slots, so `flex items-center gap-3`
 *      written for a row silently centres everything into a stack instead.
 *
 * Class 4 reads its slot list out of HeroUI's own stylesheet rather than a
 * hardcoded copy, so a HeroUI upgrade that changes which slots are columns is
 * picked up here instead of going quiet.
 *
 *   node ./scripts/check-ui-invariants.mjs
 *
 * Exit 0 when clean, 1 when anything is found, so CI can gate on it.
 *
 * To allow a deliberate exception, put `ui-check: allow <reason>` in a comment
 * on the same line. Write the reason — a bare marker with no explanation is
 * how a check turns into noise everyone silences.
 *
 * WHAT THIS CANNOT SEE: anything that needs layout. Text overflowing its cell
 * (`scrollWidth > clientWidth`) is a real defect class in this console — the
 * day-summary labels ran into each other for several commits — and catching it
 * needs a rendered page, so it belongs in a browser test, not here.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src/components";
const HEROUI_CSS = "node_modules/@heroui/styles/dist/heroui.min.css";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : (/\.tsx$/.test(path) ? [path] : []);
  });
}

const rel = (path) => path.replace(/\\/g, "/");
const lineOf = (source, index) => source.slice(0, index).split("\n").length;
const allowed = (source, index) =>
  /ui-check:\s*allow\s+\S/.test(source.split("\n")[lineOf(source, index) - 1] ?? "");

/** Slots HeroUI lays out as a column, read from its own stylesheet. */
function columnSlots() {
  let css;
  try {
    css = readFileSync(HEROUI_CSS, "utf8");
  } catch {
    return null;
  }
  const slots = new Set();
  for (const match of css.matchAll(/([a-z-]+__[a-z-]+)\{[^}]*flex-direction:column[^}]*\}/g)) {
    const [block, element] = match[1].split("__");
    // `separator__container--vertical` and friends carry modifier segments; the
    // empty pieces a double hyphen leaves behind are not name parts.
    const pascal = (value) =>
      value.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
    slots.add(`${pascal(block)}.${pascal(element)}`);
  }
  return slots;
}

const findings = [];
const report = (kind, file, line, detail) => findings.push({ kind, file, line, detail });

const HANDLED = /onPress|onClick|onPressStart|onSelectionChange|type\s*=\s*["']submit["']|href/;
const DEMO = /Mai Linh|Thảo Vy|Quỳnh Anh|Thu Hương|Mỹ Linh|Khánh An|Quỳnh Mai|17\/05\/2025|Sơn gel đơn sắc/;

const slots = columnSlots();
if (slots === null) {
  console.error(`Không đọc được ${HEROUI_CSS}. Chạy cài đặt dependency trước.`);
  process.exit(2);
}
const SLOT_PATTERN = new RegExp(
  `(${[...slots].map((s) => s.replace(".", "\\.")).join("|")}) className="([^"]*)"`,
  "g",
);

for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");
  const name = rel(file);

  // 1 — buttons with nothing behind them
  for (const match of source.matchAll(/<(Button|button)(\s[^>]*?)?(\/?)>/gs)) {
    if (HANDLED.test(match[2] ?? "") || allowed(source, match.index)) continue;
    const label = (match[0].match(/aria-label=\{?["'`]([^"'`}]{3,60})/) ?? [])[1]
      ?? (source.slice(match.index, match.index + 200).match(/>\s*([^<>{}\s][^<>{}]{2,40})/) ?? [])[1]
      ?? "?";
    report("nút không handler", name, lineOf(source, match.index), label.trim().replace(/\s+/g, " "));
  }

  // 2 — links that go nowhere
  for (const match of source.matchAll(/<(a|Link)\s[^>]*href=\{?["'`]([^"'`}]*)/g)) {
    if (!["", "#"].includes(match[2]) || allowed(source, match.index)) continue;
    report("link không đi đâu", name, lineOf(source, match.index), `href="${match[2]}"`);
  }

  // 3 — demo data rendered as content, not as a placeholder
  source.split("\n").forEach((line, index) => {
    if (/placeholder=|^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (/ui-check:\s*allow\s+\S/.test(line)) return;
    const hit = line.match(DEMO);
    if (hit) report("dữ liệu demo hiển thị như thật", name, index + 1, hit[0]);
  });

  // 4 — alignment written for a row on a slot the design system lays out as a column
  for (const match of source.matchAll(SLOT_PATTERN)) {
    const classes = match[2];
    if (!/\bflex\b/.test(classes) || !/\b(items|justify)-/.test(classes)) continue;
    if (/\bflex-(row|col)\b/.test(classes) || allowed(source, match.index)) continue;
    report(
      "canh chỉnh ngược hướng",
      name,
      lineOf(source, match.index),
      `${match[1]} — có ${classes.match(/\b(items|justify)-[a-z]+/g).join(" ")}, thiếu flex-row`,
    );
  }
}

const byKind = new Map();
for (const finding of findings) byKind.set(finding.kind, [...(byKind.get(finding.kind) ?? []), finding]);

for (const [kind, list] of byKind) {
  console.log(`\n${kind} (${list.length})`);
  for (const item of list) console.log(`  ${item.file}:${item.line}  ${item.detail}`);
}

if (findings.length === 0) {
  console.log(`Sạch — ${slots.size} slot cột đọc từ HeroUI, không có phát hiện nào.`);
  process.exit(0);
}
console.log(`\nTổng: ${findings.length} phát hiện.`);
process.exit(1);
