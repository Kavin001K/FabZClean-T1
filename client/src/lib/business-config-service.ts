import {
  businessProfileSchema,
  invoiceTemplateProfileSchema,
  storeConfigSchema,
  tagTemplateProfileSchema,
  type BusinessProfile,
  type InvoiceTemplateProfile,
  type StoreConfig,
  type TagTemplateProfile,
} from "@shared/business-config";
import { authorizedFetch } from "./data-service";

const BILLING_CACHE_KEY = "fabzclean_billing_settings_cache_v1";

type BillingCache = {
  businessProfile?: BusinessProfile;
  stores?: StoreConfig[];
  invoiceTemplates?: InvoiceTemplateProfile[];
  tagTemplates?: TagTemplateProfile[];
  updatedAt?: string;
};

function mergeByKey<T>(
  existing: T[] | undefined,
  incoming: T[] | undefined,
  getKey: (item: T) => string | undefined | null
): T[] | undefined {
  if (!incoming?.length) {
    return existing;
  }

  const merged = [...(existing || [])];

  for (const item of incoming) {
    const key = getKey(item);
    if (!key) {
      merged.push(item);
      continue;
    }

    const index = merged.findIndex((entry) => getKey(entry) === key);
    if (index >= 0) {
      merged[index] = item;
    } else {
      merged.push(item);
    }
  }

  return merged;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (text) {
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(text || `Request failed with ${response.status}`);
      }
      const message =
        parsed?.message ||
        parsed?.error ||
        parsed?.details?.message ||
        parsed?.details?.error;
      throw new Error(message || text || `Request failed with ${response.status}`);
    }
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json();
}

function persistCache(partial: Partial<BillingCache>) {
  try {
    const current = getBillingCache();
    const next = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(BILLING_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Ignore cache failures.
  }
}

export function getBillingCache(): BillingCache {
  try {
    const raw = localStorage.getItem(BILLING_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BillingCache;
  } catch {
    return {};
  }
}

export const businessConfigApi = {
  async getBusinessProfile(): Promise<BusinessProfile> {
    const response = await authorizedFetch("/settings/business-profile");
    const data = await readJson<{ success: true; profile: BusinessProfile }>(response);
    const result = businessProfileSchema.safeParse(data.profile);
    const profile = result.success ? result.data : { ...data.profile } as BusinessProfile;
    persistCache({ businessProfile: profile });
    return profile;
  },

  async updateBusinessProfile(payload: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const response = await authorizedFetch("/settings/business-profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; profile: BusinessProfile }>(response);
    const profile = businessProfileSchema.parse(data.profile);
    persistCache({ businessProfile: profile });
    return profile;
  },

  async uploadBusinessLogo(file: File): Promise<BusinessProfile> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await authorizedFetch("/settings/business-profile/logo", {
      method: "POST",
      body: formData,
    });
    const data = await readJson<{ success: true; profile: BusinessProfile }>(response);
    const profile = businessProfileSchema.parse(data.profile);
    persistCache({ businessProfile: profile });
    return profile;
  },

  async listStores(activeOnly = false): Promise<StoreConfig[]> {
    const query = activeOnly ? "?activeOnly=true" : "";
    const response = await authorizedFetch(`/settings/stores${query}`);
    const data = await readJson<{ success: true; stores: StoreConfig[] }>(response);
    const stores = (data.stores || []).map((store) => {
        const result = storeConfigSchema.safeParse(store);
        return result.success ? result.data : { ...store } as StoreConfig;
    });
    persistCache({
      stores: activeOnly
        ? mergeByKey(getBillingCache().stores, stores, (store) => store.id || store.code)
        : stores,
    });
    return stores;
  },

  async createStore(payload: Partial<StoreConfig>): Promise<StoreConfig> {
    const response = await authorizedFetch("/settings/stores", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; store: StoreConfig }>(response);
    const store = storeConfigSchema.parse(data.store);
    persistCache({
      stores: mergeByKey(getBillingCache().stores, [store], (entry) => entry.id || entry.code),
    });
    return store;
  },

  async updateStore(id: string, payload: Partial<StoreConfig>): Promise<StoreConfig> {
    const response = await authorizedFetch(`/settings/stores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; store: StoreConfig }>(response);
    const store = storeConfigSchema.parse(data.store);
    persistCache({
      stores: mergeByKey(getBillingCache().stores, [store], (entry) => entry.id || entry.code),
    });
    return store;
  },

  async uploadStoreLogo(id: string, file: File): Promise<StoreConfig> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await authorizedFetch(`/settings/stores/${id}/logo`, {
      method: "POST",
      body: formData,
    });
    const data = await readJson<{ success: true; store: StoreConfig }>(response);
    const store = storeConfigSchema.parse(data.store);
    persistCache({
      stores: mergeByKey(getBillingCache().stores, [store], (entry) => entry.id || entry.code),
    });
    return store;
  },

  async listInvoiceTemplates(storeId?: string | null, activeOnly = false): Promise<InvoiceTemplateProfile[]> {
    const params = new URLSearchParams();
    if (storeId !== undefined) params.set("storeId", storeId === null ? "global" : storeId);
    if (activeOnly) params.set("activeOnly", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await authorizedFetch(`/settings/invoice-templates${query}`);
    const data = await readJson<{ success: true; templates: InvoiceTemplateProfile[] }>(response);
    const templates = (data.templates || []).map((template) => {
        const result = invoiceTemplateProfileSchema.safeParse(template);
        return result.success ? result.data : { ...template } as InvoiceTemplateProfile;
    });
    persistCache({
      invoiceTemplates: storeId === undefined && !activeOnly
        ? templates
        : mergeByKey(getBillingCache().invoiceTemplates, templates, (template) => template.id || template.templateKey),
    });
    return templates;
  },

  async createInvoiceTemplate(payload: Partial<InvoiceTemplateProfile>): Promise<InvoiceTemplateProfile> {
    const response = await authorizedFetch("/settings/invoice-templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; template: InvoiceTemplateProfile }>(response);
    const template = invoiceTemplateProfileSchema.parse(data.template);
    persistCache({
      invoiceTemplates: mergeByKey(getBillingCache().invoiceTemplates, [template], (entry) => entry.id || entry.templateKey),
    });
    return template;
  },

  async updateInvoiceTemplate(id: string, payload: Partial<InvoiceTemplateProfile>): Promise<InvoiceTemplateProfile> {
    const response = await authorizedFetch(`/settings/invoice-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; template: InvoiceTemplateProfile }>(response);
    const template = invoiceTemplateProfileSchema.parse(data.template);
    persistCache({
      invoiceTemplates: mergeByKey(getBillingCache().invoiceTemplates, [template], (entry) => entry.id || entry.templateKey),
    });
    return template;
  },

  async optimizeInvoiceTemplate(payload: Partial<InvoiceTemplateProfile>): Promise<InvoiceTemplateProfile> {
    const response = await authorizedFetch("/algorithms/invoice-template-optimize", {
      method: "POST",
      body: JSON.stringify({ template: payload }),
    });
    const data = await readJson<{ success: true; data?: { template: InvoiceTemplateProfile }; template?: InvoiceTemplateProfile }>(response);
    const template = invoiceTemplateProfileSchema.parse(data.data?.template || data.template);
    return template;
  },

  async resolveInvoiceContext(params: {
    storeId?: string | null;
    storeCode?: string | null;
    templateId?: string | null;
    templateKey?: string | null;
  }) {
    const search = new URLSearchParams();
    if (params.storeId) search.set("storeId", params.storeId);
    if (params.storeCode) search.set("storeCode", params.storeCode);
    if (params.templateId) search.set("templateId", params.templateId);
    if (params.templateKey) search.set("templateKey", params.templateKey);
    const response = await authorizedFetch(`/settings/invoice-templates/resolve?${search.toString()}`);
    const data = await readJson<{
      success: true;
      businessProfile: BusinessProfile;
      store: StoreConfig | null;
      template: InvoiceTemplateProfile | null;
    }>(response);

    const resolved = {
      businessProfile: businessProfileSchema.parse(data.businessProfile),
      store: data.store ? storeConfigSchema.parse(data.store) : null,
      template: data.template ? invoiceTemplateProfileSchema.parse(data.template) : null,
    };

    persistCache({
      businessProfile: resolved.businessProfile,
      stores: mergeByKey(getBillingCache().stores, resolved.store ? [resolved.store] : undefined, (store) => store.id || store.code),
      invoiceTemplates: mergeByKey(getBillingCache().invoiceTemplates, resolved.template ? [resolved.template] : undefined, (template) => template.id || template.templateKey),
    });

    return resolved;
  },

  async listTagTemplates(storeId?: string | null, activeOnly = false): Promise<TagTemplateProfile[]> {
    const params = new URLSearchParams();
    if (storeId !== undefined) params.set("storeId", storeId === null ? "global" : storeId);
    if (activeOnly) params.set("activeOnly", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await authorizedFetch(`/settings/tag-templates${query}`);
    const data = await readJson<{ success: true; templates: TagTemplateProfile[] }>(response);
    const templates = (data.templates || []).map((template) => {
        const result = tagTemplateProfileSchema.safeParse(template);
        return result.success ? result.data : { ...template } as TagTemplateProfile;
    });
    persistCache({
      tagTemplates: storeId === undefined && !activeOnly
        ? templates
        : mergeByKey(getBillingCache().tagTemplates, templates, (template) => template.id || template.templateKey),
    });
    return templates;
  },

  async createTagTemplate(payload: Partial<TagTemplateProfile>): Promise<TagTemplateProfile> {
    const response = await authorizedFetch("/settings/tag-templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; template: TagTemplateProfile }>(response);
    const template = tagTemplateProfileSchema.parse(data.template);
    persistCache({
      tagTemplates: mergeByKey(getBillingCache().tagTemplates, [template], (entry) => entry.id || entry.templateKey),
    });
    return template;
  },

  async updateTagTemplate(id: string, payload: Partial<TagTemplateProfile>): Promise<TagTemplateProfile> {
    const response = await authorizedFetch(`/settings/tag-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: true; template: TagTemplateProfile }>(response);
    const template = tagTemplateProfileSchema.parse(data.template);
    persistCache({
      tagTemplates: mergeByKey(getBillingCache().tagTemplates, [template], (entry) => entry.id || entry.templateKey),
    });
    return template;
  },

  async optimizeTagTemplate(payload: Partial<TagTemplateProfile>): Promise<TagTemplateProfile> {
    const response = await authorizedFetch("/algorithms/tag-template-optimize", {
      method: "POST",
      body: JSON.stringify({ template: payload }),
    });
    const data = await readJson<{ success: true; data?: { template: TagTemplateProfile }; template?: TagTemplateProfile }>(response);
    const template = tagTemplateProfileSchema.parse(data.data?.template || data.template);
    return template;
  },

  async resolveTagTemplate(params: {
    storeId?: string | null;
    templateId?: string | null;
    templateKey?: string | null;
  }) {
    const search = new URLSearchParams();
    if (params.storeId) search.set("storeId", params.storeId);
    if (params.templateId) search.set("templateId", params.templateId);
    if (params.templateKey) search.set("templateKey", params.templateKey);
    const response = await authorizedFetch(`/settings/tag-templates/resolve?${search.toString()}`);
    const data = await readJson<{ success: true; store: StoreConfig | null; template: TagTemplateProfile | null }>(response);
    const resolved = {
      store: data.store ? storeConfigSchema.parse(data.store) : null,
      template: data.template ? tagTemplateProfileSchema.parse(data.template) : null,
    };
    persistCache({
      stores: mergeByKey(getBillingCache().stores, resolved.store ? [resolved.store] : undefined, (store) => store.id || store.code),
      tagTemplates: mergeByKey(getBillingCache().tagTemplates, resolved.template ? [resolved.template] : undefined, (template) => template.id || template.templateKey),
    });
    return resolved;
  },
};
