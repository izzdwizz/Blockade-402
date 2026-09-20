/** Cleans up raw OCR output for display: normalizes line endings, trims
 * trailing whitespace per line, and collapses runs of 3+ blank lines down to
 * a single blank line. */
export function formatOcrText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
