import {
  DEFAULT_ORDER_STORE_CODE,
  ORDER_STORE_CODES,
  type OrderStoreCode,
} from "@shared/schema";

export const ORDER_STORE_LABELS: Record<OrderStoreCode, string> = {
  POL: "Pollachi",
  KIN: "Kinathukadavu",
  MCET: "MCET",
  UDM: "Udumalpet",
};

export const ORDER_STORE_OPTIONS = ORDER_STORE_CODES.map((code) => ({
  value: code,
  label: `${code} · ${ORDER_STORE_LABELS[code]}`,
}));

const STORE_ALIASES: Record<OrderStoreCode, string[]> = {
  POL: ["pol", "pollachi"],
  KIN: ["kin", "kinathukadavu", "kinathukadavu branch"],
  MCET: ["mcet"],
  UDM: ["udm", "udumalpet"],
};

export function normalizeOrderStoreCode(value?: string | null): OrderStoreCode | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toUpperCase();
  if (ORDER_STORE_CODES.includes(normalized as OrderStoreCode)) {
    return normalized as OrderStoreCode;
  }

  const loose = value.trim().toLowerCase();
  const match = ORDER_STORE_CODES.find((code) =>
    STORE_ALIASES[code].some((alias) => loose.includes(alias))
  );

  return match;
}

export function getOrderStoreLabel(value?: string | null): string {
  const code = normalizeOrderStoreCode(value);
  if (!code) return "Unassigned";
  return `${code} · ${ORDER_STORE_LABELS[code]}`;
}

export function resolveOrderStoreCodeFromOrder(order: any): OrderStoreCode | undefined {
  return normalizeOrderStoreCode(order?.storeCode || order?.store_code);
}

export function resolveOrderStoreCodeFromEmployee(employee?: {
  storeId?: string;
  franchiseId?: string;
} | null): OrderStoreCode {
  const resolved = normalizeOrderStoreCode(employee?.storeId || employee?.franchiseId);
  return resolved || DEFAULT_ORDER_STORE_CODE;
}
