#!/usr/bin/env node
/**
 * Three things that go wrong while the console is being translated, none of which
 * lint, the unit tests or a production build can see:
 *
 *   1. a Vietnamese string left hardcoded in a component that has already been
 *      converted — it renders, it is correct in Vietnamese, and it silently
 *      ignores the locale the user picked.
 *   2. a key that exists in one catalogue and not another — next-intl falls back
 *      to the key name, so the screen shows `admin.payments.confirm` to a customer
 *      instead of a button label.
 *   3. a translated string about money or a destructive action that nobody who
 *      reads the language has checked. This one cannot be detected, only listed,
 *      which is the whole point of listing it.
 *   4. one Vietnamese term rendered two different ways across screens -- "Hoàn
 *      tiền" as 返金 on one and 払い戻し on the next. Each reads fine alone; a
 *      staff member reading both concludes they are different operations.
 *
 *   node ./scripts/check-i18n.mjs
 *
 * Exit 0 when clean, 1 when anything blocking is found, so CI can gate on it.
 *
 * WHAT CHECK 1 CANNOT SEE: it keys off Vietnamese diacritics, so unaccented
 * strings -- "Xoa", "Ban", "OK" -- pass straight through, and no automatic rule
 * separates them from English. Every screen still has to be read by eye once; this
 * only stops the ones already done from regressing.
 *
 * To allow a deliberate exception, put `i18n-check: allow <reason>` in a comment on
 * the same line. Write the reason -- a bare marker with no explanation is how a
 * check turns into noise everyone silences.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Flipped on in the last slice, once every screen has been converted. Until then a
// leak is reported but does not fail: most of the console is still hardcoded by
// design, and a gate that always fails is a gate nobody reads.
const ENFORCE_LEAKS = false;

const SCOPE = [
  "src/components/pages/admin",
  "src/components/blocks/admin",
  "src/components/layouts",
  "src/app/(admin)",
];

const CATALOGUES = ["vi", "ja", "en"];

const VIETNAMESE =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

/** Keys whose translation moves money or destroys something, so a wrong word costs. */
const SENSITIVE = /tiền|hoàn|hủy|huỷ|xóa|xoá|không đến|thanh toán|refund|delete|cancel|payment|money/i;

function walk(directory, files = []) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path)) files.push(path);
  }
  return files;
}

function findLeaks() {
  const leaks = [];
  for (const directory of SCOPE) {
    for (const path of walk(directory)) {
      const lines = readFileSync(path, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // `{/* ... */}` is a JSX comment: it reaches no screen, so it is not a leak.
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("{/*")) return;
        if (line.includes("i18n-check: allow")) return;
        if (!VIETNAMESE.test(line)) return;
        // Only text that can reach a screen: a quoted literal, or JSX text between tags.
        const quoted = line.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? [];
        const jsxText = line.match(/>[^<>{}]+</g) ?? [];
        const hits = [...quoted, ...jsxText].filter((value) => VIETNAMESE.test(value));
        if (hits.length) leaks.push({ file: relative(process.cwd(), path), line: index + 1, hits });
      });
    }
  }
  return leaks;
}

function flatten(value, prefix = "", out = new Map()) {
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) flatten(entry, path, out);
    else out.set(path, String(entry));
  }
  return out;
}

function readCatalogue(locale) {
  return flatten(JSON.parse(readFileSync(join("messages", `${locale}.json`), "utf8")));
}

const failures = [];
const notes = [];

// -- 1. leaks --------------------------------------------------------------------
const leaks = findLeaks();
if (leaks.length) {
  const files = new Set(leaks.map((leak) => leak.file));
  const message = `${leaks.length} hardcoded Vietnamese line(s) in ${files.size} file(s) still to convert`;
  if (ENFORCE_LEAKS) failures.push(message);
  else notes.push(message);
}

// -- 2. key parity ---------------------------------------------------------------
const base = readCatalogue("vi");
for (const locale of CATALOGUES.filter((entry) => entry !== "vi")) {
  const other = readCatalogue(locale);
  const missing = [...base.keys()].filter((key) => !other.has(key));
  const extra = [...other.keys()].filter((key) => !base.has(key));
  if (missing.length) failures.push(`${locale}.json is missing ${missing.length} key(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);
  if (extra.length) failures.push(`${locale}.json has ${extra.length} key(s) vi.json does not: ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? "…" : ""}`);
  // A key present but left equal to the Vietnamese source is an untranslated row.
  const untouched = [...other.entries()].filter(([key, value]) => base.get(key) === value && VIETNAMESE.test(value));
  if (untouched.length) notes.push(`${locale}.json has ${untouched.length} key(s) still holding the Vietnamese text`);
}

// -- 3. sensitive keys -----------------------------------------------------------
const sensitive = [...base.entries()].filter(([key, value]) => SENSITIVE.test(key) || SENSITIVE.test(value));
if (sensitive.length) {
  notes.push(`${sensitive.length} key(s) about money or a destructive action — have a native reader check these translations first:`);
  for (const [key] of sensitive.slice(0, 40)) notes.push(`    ${key}`);
  if (sensitive.length > 40) notes.push(`    …and ${sensitive.length - 40} more`);
}

// -- 4. glossary consistency ------------------------------------------------------
/**
 * The markdown table is the source, not a copy of it. A constant here would drift
 * from the document the moment someone edited one and not the other, and the
 * document is the artefact a Japanese reader is asked to review.
 */
function readGlossary() {
  const rows = [];
  const text = readFileSync(join("docs", "specs", "i18n-glossary.md"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split("|").map((cell) => cell.trim());
    // A data row is `| vi | ja | en | note |`: six pieces once the empty ends count.
    if (cells.length < 5 || !cells[1] || cells[1] === "VI" || cells[1].startsWith("---")) continue;
    if (!VIETNAMESE.test(cells[1])) continue;
    rows.push({ vi: cells[1], ja: cells[2], en: cells[3] });
  }
  return rows;
}

const glossary = readGlossary();
const drift = [];
for (const [key, viValue] of base.entries()) {
  const lowerVi = viValue.toLowerCase();
  const matched = glossary.filter((term) => lowerVi.includes(term.vi.toLowerCase()));
  // Longest match wins. "Lưu trữ" contains "Lưu", so without this every アーカイブ is
  // reported against the row for 保存 and the real signal drowns in it.
  const terms = matched.filter((term) =>
    !matched.some((other) => other !== term && other.vi.toLowerCase().includes(term.vi.toLowerCase()))
  );
  for (const term of terms) {
    for (const [locale, expected] of [["ja", term.ja], ["en", term.en]]) {
      const translated = readCatalogue(locale).get(key);
      if (translated === undefined) continue;
      if (!translated.toLowerCase().includes(expected.toLowerCase())) {
        drift.push(`${key} (${locale}): vi says "${term.vi}", glossary says "${expected}", catalogue says "${translated}"`);
      }
    }
  }
}
if (!glossary.length) failures.push("glossary table parsed as empty — docs/specs/i18n-glossary.md has changed shape");
if (drift.length) {
  notes.push(`${drift.length} translation(s) do not use the glossary term — substring matching, so expect false alarms on rephrasing:`);
  for (const entry of drift.slice(0, 20)) notes.push(`    ${entry}`);
  if (drift.length > 20) notes.push(`    …and ${drift.length - 20} more`);
}

// -- report ----------------------------------------------------------------------
for (const note of notes) console.log(note.startsWith("    ") ? note : `note: ${note}`);
for (const failure of failures) console.error(`fail: ${failure}`);

if (failures.length) {
  console.error(`\ni18n check failed (${failures.length}).`);
  process.exit(1);
}
console.log(`\ni18n check passed.${ENFORCE_LEAKS ? "" : " Leak enforcement is off until every screen is converted."}`);
