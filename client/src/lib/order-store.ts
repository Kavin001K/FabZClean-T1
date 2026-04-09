import {
  DEFAULT_ORDER_STORE_CODE,
  ORDER_STORE_CODES,
} from "@shared/schema";
import { getBillingCache } from "./business-config-service";

const LEGACY_ORDER_STORE_LABELS: Record<string, string> = {
  POL: "Pollachi",
  KIN: "Kinathukadavu",
  MCET: "MCET",
  UDM: "Udumalpet",
};

const STORE_ALIASES: Record<string, string[]> = {
  POL: ["pol", "pollachi"],
  KIN: ["kin", "kinathukadavu", "kinathukadavu branch"],
  MCET: ["mcet"],
  UDM: ["udm", "udumalpet"],
};

export function getOrderStoreOptions(): Array<{ value: string; label: string }> {
  const cachedStores = getBillingCache().stores || [];
  if (cachedStores.length > 0) {
    return cachedStores.map((store) => ({
      value: store.code,
      label: `${store.code} · ${store.name}`,
    }));
  }

  return ORDER_STORE_CODES.map((code) => ({
    value: code,
    label: `${code} · ${LEGACY_ORDER_STORE_LABELS[code] || code}`,
  }));
}

export function normalizeOrderStoreCode(value?: string | null): string | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toUpperCase();
  const cachedStores = getBillingCache().stores || [];
  const cachedMatch = cachedStores.find((store) =>
    store.id === value || store.code === normalized
  );
  if (cachedMatch?.code) {
    return cachedMatch.code;
  }

  if (ORDER_STORE_CODES.includes(normalized as any)) {
    return normalized;
  }

  const loose = value.trim().toLowerCase();
  const match = ORDER_STORE_CODES.find((code) =>
    (STORE_ALIASES[code] || []).some((alias) => loose.includes(alias))
  );

  return match || normalized;
}

export function getOrderStoreLabel(value?: string | null): string {
  const cachedStores = getBillingCache().stores || [];
  const cachedMatch = cachedStores.find((store) =>
    store.id === value || store.code === normalizeOrderStoreCode(value) || store.code === String(value || '').trim().toUpperCase()
  );
  if (cachedMatch) {
    return `${cachedMatch.code} · ${cachedMatch.name}`;
  }
  const code = normalizeOrderStoreCode(value);
  if (!code) return value ? String(value).trim().toUpperCase() : "Unassigned";
  return LEGACY_ORDER_STORE_LABELS[code] ? `${code} · ${LEGACY_ORDER_STORE_LABELS[code]}` : code;
}

export function resolveOrderStoreCodeFromOrder(order: any): string | undefined {
  const explicitCode = order?.storeCode || order?.store_code;
  if (explicitCode) {
    return normalizeOrderStoreCode(explicitCode);
  }

  const storeId = order?.storeId || order?.store_id;
  if (!storeId) return undefined;

  const cachedStore = (getBillingCache().stores || []).find((store) => store.id === storeId);
  return cachedStore?.code;
}

export function resolveOrderStoreCodeFromEmployee(employee?: {
  storeId?: string;
  franchiseId?: string;
} | null): string {
  const resolved = normalizeOrderStoreCode(employee?.storeId || employee?.franchiseId);
  return resolved || DEFAULT_ORDER_STORE_CODE;
}
