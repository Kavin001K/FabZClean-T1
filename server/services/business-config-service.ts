import { db } from "../db";
import {
  businessProfileSchema,
  DEFAULT_INVOICE_TEMPLATE_CONFIG,
  DEFAULT_TAG_TEMPLATE_CONFIG,
  invoiceTemplateProfileSchema,
  storeConfigSchema,
  tagTemplateProfileSchema,
  type BusinessProfile,
  type InvoiceTemplateProfile,
  type StoreConfig,
  type TagTemplateProfile,
} from "../../shared/business-config";

const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};

export class BusinessConfigService {
  async getBusinessProfile(): Promise<BusinessProfile> {
    let profile: any = null;
    try {
      profile = await (db as any).getBusinessProfile?.("global");
    } catch (err) {
      console.warn("[BusinessConfigService] Database error fetching business profile, using defaults:", err);
    }

    const result = businessProfileSchema.safeParse(profile || {
      scopeKey: "global",
      companyName: "FabZClean",
    });
    
    if (!result.success) {
      console.warn("[BusinessConfigService] Invalid business profile in DB, using partial defaults:", result.error);
      return {
        scopeKey: "global",
        companyName: (profile as any)?.companyName || "FabZClean",
        companyAddress: { line1: "", city: "", country: "India", ...asRecord((profile as any)?.companyAddress) },
        contactDetails: { phone: "", email: "", ...asRecord((profile as any)?.contactDetails) },
        taxDetails: { gstin: "", currency: "INR", ...asRecord((profile as any)?.taxDetails) },
        paymentDetails: { ...asRecord((profile as any)?.paymentDetails) },
        invoiceDefaults: { defaultDueDays: 2, defaultPrintCopies: 1, ...asRecord((profile as any)?.invoiceDefaults) },
        ...((profile as any) || {}),
      } as BusinessProfile;
    }
    return result.data;
  }

  async updateBusinessProfile(payload: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const current = await this.getBusinessProfile();
    const normalized = businessProfileSchema.parse({
      ...current,
      ...payload,
      companyAddress: { ...current.companyAddress, ...asRecord(payload.companyAddress) },
      contactDetails: { ...current.contactDetails, ...asRecord(payload.contactDetails) },
      taxDetails: { ...current.taxDetails, ...asRecord(payload.taxDetails) },
      paymentDetails: { ...current.paymentDetails, ...asRecord(payload.paymentDetails) },
      invoiceDefaults: { ...current.invoiceDefaults, ...asRecord(payload.invoiceDefaults) },
      scopeKey: "global",
    });
    const saved = await (db as any).upsertBusinessProfile(normalized);
    return businessProfileSchema.parse(saved);
  }

  async listStores(options: { activeOnly?: boolean } = {}): Promise<StoreConfig[]> {
    let rows: any[] = [];
    try {
      rows = await (db as any).listStores({ isActive: options.activeOnly ? true : undefined });
    } catch (err) {
      console.warn("[BusinessConfigService] Database error listing stores:", err);
    }

    return (rows || []).map((row: any) => {
        const result = storeConfigSchema.safeParse(row);
        if (!result.success) {
            console.warn(`[BusinessConfigService] Invalid store data for ${row.id || 'unknown'}, returning with fallbacks`);
            return {
                ...row,
                code: row.code || "??",
                name: row.name || "Unnamed Store",
                isActive: row.isActive ?? true,
                isDefault: row.isDefault ?? false,
                sortOrder: row.sortOrder ?? 0,
            } as StoreConfig;
        }
        return result.data;
    });
  }

  async getStoreById(id?: string | null): Promise<StoreConfig | null> {
    if (!id) return null;
    const store = await (db as any).getStore?.(id);
    return store ? storeConfigSchema.parse(store) : null;
  }

  async getStoreByCode(code?: string | null): Promise<StoreConfig | null> {
    if (!code) return null;
    const store = await (db as any).getStoreByCode?.(code);
    return store ? storeConfigSchema.parse(store) : null;
  }

  async createStore(payload: Partial<StoreConfig>): Promise<StoreConfig> {
    const stores = await this.listStores();
    const dataToValidate = {
      ...payload,
      code: String(payload.code || "").trim().toUpperCase(),
      sortOrder: payload.sortOrder ?? stores.length + 1,
    };

    const validation = storeConfigSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Invalid store data: ${issues}`);
    }

    if (validation.data.isDefault) {
      await this.clearStoreDefaults();
    }

    try {
      const saved = await (db as any).createStore(validation.data);
      if (!saved) throw new Error("Database failed to create store");
      
      const result = storeConfigSchema.safeParse(saved);
      return result.success ? result.data : { ...saved, ...validation.data } as StoreConfig;
    } catch (err: any) {
      console.error("[BusinessConfigService] Error creating store:", err);
      throw new Error(err.message || "Failed to create store in database");
    }
  }

  async updateStore(id: string, payload: Partial<StoreConfig>): Promise<StoreConfig> {
    const current = await this.getStoreById(id);
    if (!current) throw new Error("Store not found");

    const dataToValidate = {
      ...current,
      ...payload,
      code: String(payload.code || current.code).trim().toUpperCase(),
      address: { ...current.address, ...asRecord(payload.address) },
      contactDetails: { ...current.contactDetails, ...asRecord(payload.contactDetails) },
      legalDetails: { ...current.legalDetails, ...asRecord(payload.legalDetails) },
      invoiceOverrides: { ...current.invoiceOverrides, ...asRecord(payload.invoiceOverrides) },
      tagOverrides: { ...current.tagOverrides, ...asRecord(payload.tagOverrides) },
      id,
    };

    const validation = storeConfigSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Invalid store update data: ${issues}`);
    }

    if (validation.data.isDefault) {
      await this.clearStoreDefaults(id);
    }

    try {
      const saved = await (db as any).updateStore(id, validation.data);
      const result = storeConfigSchema.safeParse(saved);
      return result.success ? result.data : { ...saved, ...validation.data } as StoreConfig;
    } catch (err: any) {
      console.error("[BusinessConfigService] Error updating store:", err);
      throw new Error(err.message || "Failed to update store in database");
    }
  }

  async listInvoiceTemplates(options: { activeOnly?: boolean; storeId?: string | null } = {}): Promise<InvoiceTemplateProfile[]> {
    const rows = await (db as any).listInvoiceTemplates({
      isActive: options.activeOnly ? true : undefined,
      storeId: options.storeId === undefined ? undefined : options.storeId,
    });
    return (rows || []).map((row: any) => {
      const data = {
        ...row,
        config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(row?.config) },
      };
      const result = invoiceTemplateProfileSchema.safeParse(data);
      return result.success ? result.data : data as InvoiceTemplateProfile;
    });
  }

  async createInvoiceTemplate(payload: Partial<InvoiceTemplateProfile>): Promise<InvoiceTemplateProfile> {
    const normalized = invoiceTemplateProfileSchema.parse({
      ...payload,
      config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(payload.config) },
      sortOrder: payload.sortOrder ?? 0,
    });
    if (normalized.isDefault) {
      await this.clearInvoiceTemplateDefaults(normalized.storeId || null);
    }
    const saved = await (db as any).createInvoiceTemplate(normalized);
    return invoiceTemplateProfileSchema.parse({
      ...saved,
      config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(saved?.config) },
    });
  }

  async getInvoiceTemplateById(id?: string | null): Promise<InvoiceTemplateProfile | null> {
    if (!id) return null;
    const exact = await (db as any).getInvoiceTemplate?.(id);
    if (!exact) return null;
    return invoiceTemplateProfileSchema.parse({
      ...exact,
      config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(exact?.config) },
    });
  }

  async updateInvoiceTemplate(id: string, payload: Partial<InvoiceTemplateProfile>): Promise<InvoiceTemplateProfile> {
    const existing = await (db as any).getInvoiceTemplate?.(id);
    if (!existing) throw new Error("Invoice template not found");
    const current = invoiceTemplateProfileSchema.parse({
      ...existing,
      config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(existing?.config) },
    });
    const normalized = invoiceTemplateProfileSchema.parse({
      ...current,
      ...payload,
      id,
      config: { ...current.config, ...asRecord(payload.config) },
    });
    if (normalized.isDefault) {
      await this.clearInvoiceTemplateDefaults(normalized.storeId || null, id);
    }
    const saved = await (db as any).updateInvoiceTemplate(id, normalized);
    return invoiceTemplateProfileSchema.parse({
      ...saved,
      config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(saved?.config) },
    });
  }

  async listTagTemplates(options: { activeOnly?: boolean; storeId?: string | null } = {}): Promise<TagTemplateProfile[]> {
    const rows = await (db as any).listTagTemplates({
      isActive: options.activeOnly ? true : undefined,
      storeId: options.storeId === undefined ? undefined : options.storeId,
    });
    return (rows || []).map((row: any) => {
      const data = {
        ...row,
        config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(row?.config) },
      };
      const result = tagTemplateProfileSchema.safeParse(data);
      return result.success ? result.data : data as TagTemplateProfile;
    });
  }

  async createTagTemplate(payload: Partial<TagTemplateProfile>): Promise<TagTemplateProfile> {
    const normalized = tagTemplateProfileSchema.parse({
      ...payload,
      config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(payload.config) },
      sortOrder: payload.sortOrder ?? 0,
    });
    if (normalized.isDefault) {
      await this.clearTagTemplateDefaults(normalized.storeId || null);
    }
    const saved = await (db as any).createTagTemplate(normalized);
    return tagTemplateProfileSchema.parse({
      ...saved,
      config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(saved?.config) },
    });
  }

  async getTagTemplateById(id?: string | null): Promise<TagTemplateProfile | null> {
    if (!id) return null;
    const exact = await (db as any).getTagTemplate?.(id);
    if (!exact) return null;
    return tagTemplateProfileSchema.parse({
      ...exact,
      config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(exact?.config) },
    });
  }

  async updateTagTemplate(id: string, payload: Partial<TagTemplateProfile>): Promise<TagTemplateProfile> {
    const existing = await (db as any).getTagTemplate?.(id);
    if (!existing) throw new Error("Tag template not found");
    const current = tagTemplateProfileSchema.parse({
      ...existing,
      config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(existing?.config) },
    });
    const normalized = tagTemplateProfileSchema.parse({
      ...current,
      ...payload,
      id,
      config: { ...current.config, ...asRecord(payload.config) },
    });
    if (normalized.isDefault) {
      await this.clearTagTemplateDefaults(normalized.storeId || null, id);
    }
    const saved = await (db as any).updateTagTemplate(id, normalized);
    return tagTemplateProfileSchema.parse({
      ...saved,
      config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(saved?.config) },
    });
  }

  async resolveInvoiceTemplate(params: { storeId?: string | null; templateId?: string | null; templateKey?: string | null }): Promise<InvoiceTemplateProfile | null> {
    if (params.templateId) {
      const exact = await (db as any).getInvoiceTemplate?.(params.templateId);
      if (exact) {
        return invoiceTemplateProfileSchema.parse({
          ...exact,
          config: { ...DEFAULT_INVOICE_TEMPLATE_CONFIG, ...asRecord(exact?.config) },
        });
      }
    }

    const active = await this.listInvoiceTemplates({ activeOnly: true, storeId: params.storeId || undefined });
    if (params.templateKey) {
      const keyed = active.find((template) => template.templateKey === params.templateKey);
      if (keyed) return keyed;
    }

    const storeDefault = active.find((template) => template.isDefault);
    if (storeDefault) return storeDefault;

    const globalTemplates = await this.listInvoiceTemplates({ activeOnly: true, storeId: null });
    if (params.templateKey) {
      const keyedGlobal = globalTemplates.find((template) => template.templateKey === params.templateKey);
      if (keyedGlobal) return keyedGlobal;
    }

    return globalTemplates.find((template) => template.isDefault) || globalTemplates[0] || null;
  }

  async resolveTagTemplate(params: { storeId?: string | null; templateId?: string | null; templateKey?: string | null }): Promise<TagTemplateProfile | null> {
    if (params.templateId) {
      const exact = await (db as any).getTagTemplate?.(params.templateId);
      if (exact) {
        return tagTemplateProfileSchema.parse({
          ...exact,
          config: { ...DEFAULT_TAG_TEMPLATE_CONFIG, ...asRecord(exact?.config) },
        });
      }
    }

    const active = await this.listTagTemplates({ activeOnly: true, storeId: params.storeId || undefined });
    if (params.templateKey) {
      const keyed = active.find((template) => template.templateKey === params.templateKey);
      if (keyed) return keyed;
    }

    const storeDefault = active.find((template) => template.isDefault);
    if (storeDefault) return storeDefault;

    const globalTemplates = await this.listTagTemplates({ activeOnly: true, storeId: null });
    if (params.templateKey) {
      const keyedGlobal = globalTemplates.find((template) => template.templateKey === params.templateKey);
      if (keyedGlobal) return keyedGlobal;
    }

    return globalTemplates.find((template) => template.isDefault) || globalTemplates[0] || null;
  }

  async resolveInvoiceContext(params: { storeId?: string | null; storeCode?: string | null; templateId?: string | null; templateKey?: string | null }) {
    const businessProfile = await this.getBusinessProfile();
    const store = params.storeId
      ? await this.getStoreById(params.storeId)
      : await this.getStoreByCode(params.storeCode || "");
    const template = await this.resolveInvoiceTemplate({
      storeId: store?.id || params.storeId || null,
      templateId: params.templateId || null,
      templateKey: params.templateKey || null,
    });

    return { businessProfile, store, template };
  }

  async resolveDefaultStore(params: { employeeStoreId?: string | null; employeeFranchiseId?: string | null; activeOnly?: boolean } = {}): Promise<StoreConfig | null> {
    const candidates = [
      params.employeeStoreId,
      params.employeeFranchiseId,
    ].filter(Boolean) as string[];

    for (const value of candidates) {
      const direct = await this.getStoreById(value);
      if (direct && (!params.activeOnly || direct.isActive)) return direct;
      const byCode = await this.getStoreByCode(value);
      if (byCode && (!params.activeOnly || byCode.isActive)) return byCode;
    }

    const stores = await this.listStores({ activeOnly: params.activeOnly });
    return stores.find((store) => store.isDefault) || stores[0] || null;
  }

  private async clearStoreDefaults(exceptId?: string) {
    const stores = await this.listStores();
    await Promise.all(
      stores
        .filter((store) => store.isDefault && store.id !== exceptId)
        .map((store) => (db as any).updateStore(store.id!, { isDefault: false }))
    );
  }

  private async clearInvoiceTemplateDefaults(storeId: string | null, exceptId?: string) {
    const templates = await this.listInvoiceTemplates({ storeId });
    await Promise.all(
      templates
        .filter((template) => template.isDefault && template.id !== exceptId)
        .map((template) => (db as any).updateInvoiceTemplate(template.id!, { isDefault: false }))
    );
  }

  private async clearTagTemplateDefaults(storeId: string | null, exceptId?: string) {
    const templates = await this.listTagTemplates({ storeId });
    await Promise.all(
      templates
        .filter((template) => template.isDefault && template.id !== exceptId)
        .map((template) => (db as any).updateTagTemplate(template.id!, { isDefault: false }))
    );
  }
}

export const businessConfigService = new BusinessConfigService();
