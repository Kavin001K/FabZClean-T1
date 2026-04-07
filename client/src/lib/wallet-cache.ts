const WALLET_CUSTOMERS_CACHE_KEY = "wallet_customers_cache";
const WALLET_CUSTOMERS_CACHE_VERSION = 1;

interface WalletCustomersCachePayload<T> {
  version: number;
  updatedAt: number;
  customers: T[];
}

export interface WalletCustomersCacheRead<T> {
  customers: T[];
  updatedAt: number;
}

export const readWalletCustomersCache = <T>(): WalletCustomersCacheRead<T> | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(WALLET_CUSTOMERS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        customers: parsed as T[],
        updatedAt: 0,
      };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.customers)
    ) {
      return {
        customers: parsed.customers as T[],
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      };
    }
  } catch (error) {
    console.error("Failed to read wallet customers cache", error);
  }

  return null;
};

export const writeWalletCustomersCache = <T>(customers: T[]) => {
  if (typeof window === "undefined") return;

  try {
    const payload: WalletCustomersCachePayload<T> = {
      version: WALLET_CUSTOMERS_CACHE_VERSION,
      updatedAt: Date.now(),
      customers,
    };
    localStorage.setItem(WALLET_CUSTOMERS_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to write wallet customers cache", error);
  }
};

export const clearWalletCustomersCache = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(WALLET_CUSTOMERS_CACHE_KEY);
  } catch (error) {
    console.error("Failed to clear wallet customers cache", error);
  }
};
