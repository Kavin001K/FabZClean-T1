import { ROLE_NAV_ACCESS, type SystemRole } from "@shared/schema";

export type Theme = "light" | "dark" | "system";
export type LandingPage = "/dashboard" | "/orders" | "/create-order" | "/customers" | "/services";

export const AVAILABLE_QUICK_ACTIONS = [
  { id: "new-order", label: "New Order", icon: "Plus" },
  { id: "active-orders", label: "Orders", icon: "Receipt" },
  { id: "customer-search", label: "Customers", icon: "Users" },
  { id: "services", label: "Services", icon: "Settings" },
  { id: "print-queue", label: "Print Tags", icon: "FileText" },
] as const;

export type QuickActionId = typeof AVAILABLE_QUICK_ACTIONS[number]["id"];

export interface UserSettings {
  theme: Theme;
  landingPage: LandingPage;
  compactMode: boolean;
  quickActions: QuickActionId[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  landingPage: "/dashboard",
  compactMode: false,
  quickActions: ["new-order", "active-orders", "customer-search", "print-queue"],
};

const VALID_THEMES = new Set<Theme>(["light", "dark", "system"]);
const VALID_LANDING_PAGES = new Set<LandingPage>(["/dashboard", "/orders", "/create-order", "/customers", "/services"]);
const VALID_QUICK_ACTIONS = new Set<QuickActionId>(AVAILABLE_QUICK_ACTIONS.map((action) => action.id));
const STORAGE_KEY_PREFIX = "fabzclean_user_settings_v1";

export function getUserSettingsStorageKey(userId?: string | null) {
  return `${STORAGE_KEY_PREFIX}:${userId || "guest"}`;
}

export function normalizeTheme(value: unknown): Theme {
  return typeof value === "string" && VALID_THEMES.has(value as Theme)
    ? (value as Theme)
    : DEFAULT_SETTINGS.theme;
}

export function normalizeLandingPage(value: unknown): LandingPage {
  return typeof value === "string" && VALID_LANDING_PAGES.has(value as LandingPage)
    ? (value as LandingPage)
    : DEFAULT_SETTINGS.landingPage;
}

export function normalizeQuickActions(value: unknown): QuickActionId[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SETTINGS.quickActions;
  }

  const uniqueActions = Array.from(new Set(value))
    .filter((action): action is QuickActionId => typeof action === "string" && VALID_QUICK_ACTIONS.has(action as QuickActionId))
    .slice(0, 4);

  return uniqueActions.length > 0 ? uniqueActions : DEFAULT_SETTINGS.quickActions;
}

export function normalizeUserSettings(value: unknown): UserSettings {
  const raw = (value && typeof value === "object") ? value as Partial<UserSettings> : {};

  return {
    theme: normalizeTheme(raw.theme),
    landingPage: normalizeLandingPage(raw.landingPage),
    compactMode: Boolean(raw.compactMode),
    quickActions: normalizeQuickActions(raw.quickActions),
  };
}

export function mergeUserSettings(...values: unknown[]): UserSettings {
  const merged = values.reduce<Record<string, unknown>>((acc, value) => {
    if (value && typeof value === "object") {
      Object.assign(acc, value);
    }
    return acc;
  }, {});

  return normalizeUserSettings(merged);
}

export function readStoredUserSettings(userId?: string | null): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(getUserSettingsStorageKey(userId));
    return stored ? normalizeUserSettings(JSON.parse(stored)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function resolveLandingPage(requestedPage: unknown, role?: string | null): LandingPage | string {
  const candidate = normalizeLandingPage(requestedPage);
  const normalizedRole = role as SystemRole | undefined;

  if (!normalizedRole || !ROLE_NAV_ACCESS[normalizedRole]) {
    return candidate;
  }

  const allowedRoutes = ROLE_NAV_ACCESS[normalizedRole];
  if (allowedRoutes.includes(candidate)) {
    return candidate;
  }

  const firstUsableRoute = allowedRoutes.find((route) => route !== "/");
  return firstUsableRoute || DEFAULT_SETTINGS.landingPage;
}
