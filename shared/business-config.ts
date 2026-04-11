import { z } from "zod";

export const invoiceTemplatePresetKeys = ["classic", "modern", "compact", "express", "edited"] as const;
export type InvoiceTemplatePresetKey = (typeof invoiceTemplatePresetKeys)[number];

export const tagTemplateLayoutKeys = ["thermal_compact"] as const;
export type TagTemplateLayoutKey = (typeof tagTemplateLayoutKeys)[number];

export const addressSchema = z.object({
  line1: z.string().optional().default(""),
  line2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
  country: z.string().optional().default("India"),
});

export type AddressFields = z.infer<typeof addressSchema>;

export const contactDetailsSchema = z.object({
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  website: z.string().optional().default(""),
  whatsappNumber: z.string().optional().default(""),
});

export type ContactDetails = z.infer<typeof contactDetailsSchema>;

export const taxDetailsSchema = z.object({
  gstin: z.string().optional().default(""),
  pan: z.string().optional().default(""),
  currency: z.string().optional().default("INR"),
});

export type TaxDetails = z.infer<typeof taxDetailsSchema>;

export const paymentDetailsSchema = z.object({
  upiId: z.string().optional().default(""),
  upiName: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  bankAccountName: z.string().optional().default(""),
  bankAccountNumber: z.string().optional().default(""),
  bankIfsc: z.string().optional().default(""),
  bankBranch: z.string().optional().default(""),
});

export type PaymentDetails = z.infer<typeof paymentDetailsSchema>;

export const invoiceTemplateConfigSchema = z.object({
  showLogo: z.boolean().default(true),
  showStoreAddress: z.boolean().default(true),
  showCustomerAddress: z.boolean().default(true),
  showItemNotes: z.boolean().default(true),
  showTerms: z.boolean().default(true),
  showPaymentQr: z.boolean().default(true),
  showPaymentBreakdown: z.boolean().default(true),
  showGstBreakup: z.boolean().default(true),
  showDeliveryBlock: z.boolean().default(true),
  showSignature: z.boolean().default(true),
  footerNote: z.string().optional().default(""),
  termsAndConditions: z.string().optional().default(""),
  paymentQrLabel: z.string().optional().default("Scan to pay"),
});

export type InvoiceTemplateConfig = z.infer<typeof invoiceTemplateConfigSchema>;

export const tagTemplateConfigSchema = z.object({
  showStoreCode: z.boolean().default(true),
  showCustomerName: z.boolean().default(true),
  showOrderNumber: z.boolean().default(true),
  showServiceName: z.boolean().default(true),
  showDueDate: z.boolean().default(true),
  showQuantity: z.boolean().default(true),
  showTagNote: z.boolean().default(true),
  maxNoteChars: z.number().int().min(0).max(160).default(32),
});

export type TagTemplateConfig = z.infer<typeof tagTemplateConfigSchema>;

export const invoiceDefaultsSchema = z.object({
  defaultDueDays: z.number().int().min(0).max(365).default(2),
  defaultPickupWording: z.string().optional().default("Pickup"),
  defaultPrintCopies: z.number().int().min(1).max(10).default(1),
  useTemplateBasedInvoices: z.boolean().default(false),
  logoUrl: z.string().optional().default(""),
  showLogo: z.boolean().default(true),
  showStoreAddress: z.boolean().default(true),
  showCustomerAddress: z.boolean().default(true),
  showItemNotes: z.boolean().default(true),
  showTerms: z.boolean().default(true),
  showPaymentQr: z.boolean().default(true),
  showGstBreakup: z.boolean().default(true),
  showPaymentBreakdown: z.boolean().default(true),
  showDeliveryBlock: z.boolean().default(true),
  showSignature: z.boolean().default(true),
  footerNote: z.string().optional().default(""),
  termsAndConditions: z.string().optional().default(""),
  paymentQrLabel: z.string().optional().default("Scan to pay"),
  whatsappBillMessage: z.string().optional().default(""),
  defaultInvoiceTemplateKey: z.string().optional().default(""),
  defaultTagTemplateKey: z.string().optional().default(""),
});

export type InvoiceDefaults = z.infer<typeof invoiceDefaultsSchema>;

export const businessProfileSchema = z.object({
  id: z.string().optional(),
  scopeKey: z.string().default("global"),
  companyName: z.string().min(1),
  legalName: z.string().optional().default(""),
  companyAddress: addressSchema.default({}),
  contactDetails: contactDetailsSchema.default({}),
  taxDetails: taxDetailsSchema.default({}),
  paymentDetails: paymentDetailsSchema.default({}),
  invoiceDefaults: invoiceDefaultsSchema.default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

export const storeConfigSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(10),
  name: z.string().min(1),
  shortName: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  address: addressSchema.default({}),
  contactDetails: contactDetailsSchema.default({}),
  legalDetails: z.record(z.any()).default({}),
  invoiceOverrides: z.record(z.any()).default({}),
  tagOverrides: z.record(z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type StoreConfig = z.infer<typeof storeConfigSchema>;

export const invoiceTemplateProfileSchema = z.object({
  id: z.string().optional(),
  templateKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  presetKey: z.enum(invoiceTemplatePresetKeys),
  storeId: z.string().optional().nullable(),
  isAiOptimized: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  config: invoiceTemplateConfigSchema.default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InvoiceTemplateProfile = z.infer<typeof invoiceTemplateProfileSchema>;

export const tagTemplateProfileSchema = z.object({
  id: z.string().optional(),
  templateKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  layoutKey: z.enum(tagTemplateLayoutKeys).default("thermal_compact"),
  storeId: z.string().optional().nullable(),
  isAiOptimized: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  config: tagTemplateConfigSchema.default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TagTemplateProfile = z.infer<typeof tagTemplateProfileSchema>;

export interface InvoiceSnapshot {
  businessProfile: BusinessProfile | null;
  store: StoreConfig | null;
  template: InvoiceTemplateProfile | null;
  rendererMode: "standard" | "template";
  variantKey: string;
  generatedAt: string;
  orderSummary: {
    orderId?: string;
    orderNumber?: string;
    customerName?: string;
    total?: number;
    storeCode?: string;
  };
}

export const DEFAULT_INVOICE_TEMPLATE_CONFIG: InvoiceTemplateConfig = invoiceTemplateConfigSchema.parse({});
export const DEFAULT_TAG_TEMPLATE_CONFIG: TagTemplateConfig = tagTemplateConfigSchema.parse({});
