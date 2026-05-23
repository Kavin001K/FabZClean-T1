export type ParsedCustomerPhones = {
  primaryPhone: string;
  secondaryPhone: string | null;
  allPhones: string[];
};

const PHONE_SPLIT_REGEX = /[,\n;]+/;

export function cleanAndNormalizePhone(value?: string | null): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function normalizePhoneForComparison(value?: string | null): string {
  const digits = cleanAndNormalizePhone(value);
  return digits.slice(-10);
}

export function sanitizePhoneForStorage(value?: string | null): string {
  return cleanAndNormalizePhone(value);
}


export function parseCustomerPhones(input?: string | null): ParsedCustomerPhones {
  const rawParts = String(input || "")
    .split(PHONE_SPLIT_REGEX)
    .map((part) => sanitizePhoneForStorage(part))
    .filter(Boolean);

  const uniqueParts: string[] = [];
  const seen = new Set<string>();

  for (const part of rawParts) {
    const comparisonKey = normalizePhoneForComparison(part) || part;
    if (seen.has(comparisonKey)) continue;
    seen.add(comparisonKey);
    uniqueParts.push(part);
  }

  return {
    primaryPhone: uniqueParts[0] || "",
    secondaryPhone: uniqueParts[1] || null,
    allPhones: uniqueParts.slice(0, 2),
  };
}

export function formatCustomerPhonesForInput(primary?: string | null, secondary?: string | null): string {
  return [sanitizePhoneForStorage(primary), sanitizePhoneForStorage(secondary)]
    .filter(Boolean)
    .join(", ");
}
