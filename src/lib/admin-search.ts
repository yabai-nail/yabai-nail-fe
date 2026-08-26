/**
 * One text match for every admin list, because there were seven near-identical
 * copies and six of them crashed the screen on the same input.
 *
 * Each copy read its fields as plain strings and called `toLocaleLowerCase`
 * straight on them. The hand-written row types say `string`; the API sends null
 * for a customer with no phone, a log entry whose actor no longer resolves, a
 * design with no title. Typing one character into the accounts search threw
 * "Cannot read properties of null" and Next replaced the console with "This page
 * couldn't load" — a blank error page from a search box.
 *
 * Coercing here means a null field simply never matches, which is what every
 * call site wanted in the first place.
 */
export function matchesSearch(query: string, fields: ReadonlyArray<unknown>): boolean {
  const normalized = query.trim().toLocaleLowerCase("vi");
  if (!normalized) return true;
  return fields.some((field) =>
    field === null || field === undefined
      ? false
      : String(field).toLocaleLowerCase("vi").includes(normalized),
  );
}
