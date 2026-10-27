export const MAX_HIGHLIGHTS = 12;
export const MAX_HIGHLIGHT_LENGTH = 200;

export function normalizeHighlights(lines: readonly string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean);
}
