export function formatUsdc(baseUnits: string): string {
  return (Number(baseUnits) / 1_000_000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
