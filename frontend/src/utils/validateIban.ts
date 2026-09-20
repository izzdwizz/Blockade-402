const COUNTRY_NAMES: Record<string, string> = {
  DE: "Germany",
  GB: "United Kingdom",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  NG: "Nigeria",
  IE: "Ireland",
  CH: "Switzerland",
  BE: "Belgium",
};

export interface IbanCheckResult {
  valid: boolean;
  countryCode: string | null;
  countryName: string | null;
}

function mod97(numStr: string): number {
  let remainder = numStr;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }
  return parseInt(remainder, 10) % 97;
}

export function checkIban(raw: string): IbanCheckResult {
  const iban = raw.replace(/\s+/g, "").toUpperCase();

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
    return { valid: false, countryCode: null, countryName: null };
  }

  const countryCode = iban.slice(0, 2);
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  const valid = mod97(expanded) === 1;

  return {
    valid,
    countryCode: valid ? countryCode : null,
    countryName: valid ? (COUNTRY_NAMES[countryCode] ?? countryCode) : null,
  };
}
