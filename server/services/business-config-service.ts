import {
  businessProfileSchema,
  invoiceTemplateProfileSchema,
  storeConfigSchema,
  type BusinessProfile,
  type InvoiceTemplateProfile,
  type StoreConfig,
} from "../../shared/business-config";
import { storage } from "../storage";

type ResolveInvoiceContextParams = {
  storeId?: string | null;
  storeCode?: string | null;
  templateId?: string | null;
  templateKey?: string | null;
};

type ResolvedInvoiceContext = {
  businessProfile: BusinessProfile;
  store: StoreConfig | null;
  template: InvoiceTemplateProfile | null;
};

const DEFAULT_BUSINESS_PROFILE: BusinessProfile = businessProfileSchema.parse({
  scopeKey: "global",
  companyName: "Fab Clean",
});

class BusinessConfigService {
  async getBusinessProfile(scopeKey = "global"): Promise<BusinessProfile> {
    try {
      const profile = await (storage as any).getBusinessProfile?.(scopeKey);
      if (!profile) {
        return DEFAULT_BUSINESS_PROFILE;
      }
      return businessProfileSchema.parse(profile);
    } catch (error) {
      console.warn("[business-config-service] Falling back to default business profile:", error);
      return DEFAULT_BUSINESS_PROFILE;
    }
  }

  async resolveStore(params: Pick<ResolveInvoiceContextParams, "storeId" | "storeCode">): Promise<StoreConfig | null> {
    const { storeId, storeCode } = params;

    if (storeId) {
      const store = await (storage as any).getStore?.(storeId);
      return store ? storeConfigSchema.parse(store) : null;
    }

    if (storeCode) {
      const store = await (storage as any).getStoreByCode?.(storeCode);
      return store ? storeConfigSchema.parse(store) : null;
    }

    return null;
  }

  async resolveInvoiceTemplate(params: {
    store: StoreConfig | null;
    templateId?: string | null;
    templateKey?: string | null;
  }): Promise<InvoiceTemplateProfile | null> {
    const { store, templateId, templateKey } = params;

    if (templateId) {
      const direct = await (storage as any).getInvoiceTemplate?.(templateId);
      return direct ? invoiceTemplateProfileSchema.parse(direct) : null;
    }

    const scopedTemplates = [
      ...await (storage as any).listInvoiceTemplates?.({ storeId: store?.id || null, isActive: true }) || [],
      ...(store?.id ? await (storage as any).listInvoiceTemplates?.({ storeId: null, isActive: true }) || [] : []),
    ].map((template: unknown) => invoiceTemplateProfileSchema.parse(template));

    if (templateKey) {
      return scopedTemplates.find((template) => template.templateKey === templateKey) || null;
    }

    return (
      scopedTemplates.find((template) => template.isDefault) ||
      scopedTemplates[0] ||
      null
    );
  }

  async resolveInvoiceContext(params: ResolveInvoiceContextParams): Promise<ResolvedInvoiceContext> {
    const [businessProfile, store] = await Promise.all([
      this.getBusinessProfile(),
      this.resolveStore(params),
    ]);

    const template = await this.resolveInvoiceTemplate({
      store,
      templateId: params.templateId,
      templateKey: params.templateKey,
    });

    return {
      businessProfile,
      store,
      template,
    };
  }
}

export const businessConfigService = new BusinessConfigService();
