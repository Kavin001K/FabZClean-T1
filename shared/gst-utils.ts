/**
 * GST (Goods and Services Tax) Utilities for Indian Tax Compliance
 *
 * This module provides comprehensive GST calculations following Indian tax regulations.
 * Supports CGST, SGST, IGST, and various HSN/SAC codes for laundry services.
 */

// GST Rates as per Indian Tax System
export enum GSTRate {
  EXEMPT = 0,
  GST_5 = 5,
  GST_12 = 12,
  GST_18 = 18,
  GST_28 = 28,
}

// HSN/SAC Codes for Laundry Services
export enum ServiceCode {
  // Laundry and dry cleaning services
  LAUNDRY_SERVICES = '998561',
  DRY_CLEANING = '998562',
  IRONING_PRESSING = '998563',
  FABRIC_TREATMENT = '998564',

  // Additional services
  PICKUP_DELIVERY = '996511',
  STORAGE_SERVICES = '996901',
  PREMIUM_SERVICES = '998569',
}

// Service Type to GST Rate Mapping
export const SERVICE_GST_MAPPING: Record<string, { rate: GSTRate; sacCode: ServiceCode; description: string }> = {
  'Dry Clean': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.DRY_CLEANING,
    description: 'Dry cleaning services',
  },
  'Wash & Iron': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.LAUNDRY_SERVICES,
    description: 'Washing and ironing services',
  },
  'Steam Iron': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.IRONING_PRESSING,
    description: 'Steam ironing and pressing services',
  },
  'Wash & Fold': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.LAUNDRY_SERVICES,
    description: 'Washing and folding services',
  },
  'Premium Clean': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.PREMIUM_SERVICES,
    description: 'Premium cleaning services',
  },
  'Fabric Treatment': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.FABRIC_TREATMENT,
    description: 'Fabric stain removal and treatment',
  },
  'Pickup & Delivery': {
    rate: GSTRate.GST_5,
    sacCode: ServiceCode.PICKUP_DELIVERY,
    description: 'Pickup and delivery services',
  },
  'Storage': {
    rate: GSTRate.GST_18,
    sacCode: ServiceCode.STORAGE_SERVICES,
    description: 'Garment storage services',
  },
};

// Product GST Categories
export const PRODUCT_GST_MAPPING: Record<string, { rate: GSTRate; hsnCode: string; description: string }> = {
  'Detergent': {
    rate: GSTRate.GST_18,
    hsnCode: '3402',
    description: 'Organic surface-active agents',
  },
  'Fabric Softener': {
    rate: GSTRate.GST_18,
    hsnCode: '3809',
    description: 'Finishing agents',
  },
  'Stain Remover': {
    rate: GSTRate.GST_18,
    hsnCode: '3402',
    description: 'Stain removal preparations',
  },
  'Bleach': {
    rate: GSTRate.GST_12,
    hsnCode: '3808',
    description: 'Disinfectants',
  },
  'Hanger': {
    rate: GSTRate.GST_12,
    hsnCode: '3924',
    description: 'Plastic household articles',
  },
  'Packaging': {
    rate: GSTRate.GST_12,
    hsnCode: '3923',
    description: 'Plastic packaging materials',
  },
};

/**
 * Interface for GST calculation breakdown
 */
export interface GSTBreakdown {
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  gstRate: number;
  isInterState: boolean;
  sacCode?: string;
  hsnCode?: string;
}

/**
 * Interface for line item with GST
 */
export interface LineItemWithGST {
  description: string;
  quantity: number;
  unitPrice: number;
  baseAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  sacCode?: string;
  hsnCode?: string;
}

/**
 * Calculate GST for a given amount
 *
 * @param baseAmount - Amount before tax
 * @param gstRate - GST rate (5, 12, 18, or 28)
 * @param isInterState - Whether transaction is inter-state (IGST) or intra-state (CGST+SGST)
 * @returns GST breakdown with all components
 */
export function calculateGST(
  baseAmount: number,
  gstRate: GSTRate,
  isInterState: boolean = false
): GSTBreakdown {
  const gstAmount = (baseAmount * gstRate) / 100;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    // Inter-state transaction: Only IGST applies
    igst = gstAmount;
  } else {
    // Intra-state transaction: CGST + SGST (split equally)
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  }

  return {
    baseAmount: Number(baseAmount.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    igst: Number(igst.toFixed(2)),
    totalGst: Number(gstAmount.toFixed(2)),
    totalAmount: Number((baseAmount + gstAmount).toFixed(2)),
    gstRate,
    isInterState,
  };
}

/**
 * Calculate reverse GST (extract GST from total amount)
 *
 * @param totalAmount - Total amount including GST
 * @param gstRate - GST rate
 * @param isInterState - Whether transaction is inter-state
 * @returns GST breakdown
 */
export function calculateReverseGST(
  totalAmount: number,
  gstRate: GSTRate,
  isInterState: boolean = false
): GSTBreakdown {
  const baseAmount = (totalAmount * 100) / (100 + gstRate);
  return calculateGST(baseAmount, gstRate, isInterState);
}

/**
 * Get GST rate for a service type
 *
 * @param serviceType - Type of service
 * @returns GST rate and SAC code
 */
export function getServiceGSTRate(serviceType: string): {
  rate: GSTRate;
  sacCode: ServiceCode;
  description: string;
} {
  return (
    SERVICE_GST_MAPPING[serviceType] || {
      rate: GSTRate.GST_18,
      sacCode: ServiceCode.LAUNDRY_SERVICES,
      description: 'Laundry services',
    }
  );
}

/**
 * Get GST rate for a product
 *
 * @param productType - Type of product
 * @returns GST rate and HSN code
 */
export function getProductGSTRate(productType: string): {
  rate: GSTRate;
  hsnCode: string;
  description: string;
} {
  return (
    PRODUCT_GST_MAPPING[productType] || {
      rate: GSTRate.GST_18,
      hsnCode: '3402',
      description: 'Cleaning products',
    }
  );
}

/**
 * Calculate GST for an order with multiple line items
 *
 * @param items - Array of line items
 * @param isInterState - Whether transaction is inter-state
 * @returns Array of line items with GST calculations
 */
export function calculateOrderGST(
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    serviceType?: string;
    productType?: string;
  }>,
  isInterState: boolean = false
): { items: LineItemWithGST[]; summary: GSTBreakdown } {
  const itemsWithGST: LineItemWithGST[] = items.map((item) => {
    const baseAmount = item.quantity * item.unitPrice;
    let gstRate: GSTRate;
    let sacCode: string | undefined;
    let hsnCode: string | undefined;

    if (item.serviceType) {
      const serviceInfo = getServiceGSTRate(item.serviceType);
      gstRate = serviceInfo.rate;
      sacCode = serviceInfo.sacCode;
    } else if (item.productType) {
      const productInfo = getProductGSTRate(item.productType);
      gstRate = productInfo.rate;
      hsnCode = productInfo.hsnCode;
    } else {
      gstRate = GSTRate.GST_18;
    }

    const gstBreakdown = calculateGST(baseAmount, gstRate, isInterState);

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      baseAmount: gstBreakdown.baseAmount,
      gstRate: gstBreakdown.gstRate,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      igst: gstBreakdown.igst,
      totalAmount: gstBreakdown.totalAmount,
      sacCode,
      hsnCode,
    };
  });

  // Calculate summary
  const summary: GSTBreakdown = {
    baseAmount: itemsWithGST.reduce((sum, item) => sum + item.baseAmount, 0),
    cgst: itemsWithGST.reduce((sum, item) => sum + item.cgst, 0),
    sgst: itemsWithGST.reduce((sum, item) => sum + item.sgst, 0),
    igst: itemsWithGST.reduce((sum, item) => sum + item.igst, 0),
    totalGst: itemsWithGST.reduce(
      (sum, item) => sum + (item.cgst + item.sgst + item.igst),
      0
    ),
    totalAmount: itemsWithGST.reduce((sum, item) => sum + item.totalAmount, 0),
    gstRate: 0, // Mixed rates
    isInterState,
  };

  // Round summary values
  summary.baseAmount = Number(summary.baseAmount.toFixed(2));
  summary.cgst = Number(summary.cgst.toFixed(2));
  summary.sgst = Number(summary.sgst.toFixed(2));
  summary.igst = Number(summary.igst.toFixed(2));
  summary.totalGst = Number(summary.totalGst.toFixed(2));
  summary.totalAmount = Number(summary.totalAmount.toFixed(2));

  return { items: itemsWithGST, summary };
}

/**
 * Format amount in Indian Rupee format
 *
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "₹1,23,456.78")
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number in Indian numbering system (lakhs and crores)
 *
 * @param num - Number to format
 * @returns Formatted string with Indian separators
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Validate GSTIN (GST Identification Number)
 *
 * Format: 22AAAAA0000A1Z5
 * - First 2 digits: State code
 * - Next 10 characters: PAN number
 * - Next character: Entity number (1-9, A-Z)
 * - Next character: 'Z' by default
 * - Last character: Check digit
 *
 * @param gstin - GSTIN to validate
 * @returns Whether GSTIN is valid
 */
export function validateGSTIN(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) {
    return false;
  }

  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinPattern.test(gstin);
}

/**
 * Extract state code from GSTIN
 *
 * @param gstin - GSTIN
 * @returns State code (first 2 digits)
 */
export function getStateCodeFromGSTIN(gstin: string): string {
  if (!validateGSTIN(gstin)) {
    throw new Error('Invalid GSTIN');
  }
  return gstin.substring(0, 2);
}

/**
 * Determine if transaction is inter-state based on GSTINs
 *
 * @param sellerGSTIN - Seller's GSTIN
 * @param buyerGSTIN - Buyer's GSTIN
 * @returns Whether transaction is inter-state
 */
export function isInterStateTransaction(
  sellerGSTIN: string,
  buyerGSTIN: string
): boolean {
  const sellerState = getStateCodeFromGSTIN(sellerGSTIN);
  const buyerState = getStateCodeFromGSTIN(buyerGSTIN);
  return sellerState !== buyerState;
}

/**
 * Indian State Codes for GST
 */
export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

/**
 * Get state name from GSTIN
 *
 * @param gstin - GSTIN
 * @returns State name
 */
export function getStateName(gstin: string): string {
  const stateCode = getStateCodeFromGSTIN(gstin);
  return INDIAN_STATE_CODES[stateCode] || 'Unknown State';
}

/**
 * Calculate GST liability for a period (for returns)
 *
 * @param sales - Total sales for the period
 * @param purchases - Total purchases for the period
 * @returns GST liability breakdown
 */
export function calculateGSTLiability(
  sales: { cgst: number; sgst: number; igst: number },
  purchases: { cgst: number; sgst: number; igst: number }
): {
  outputCGST: number;
  outputSGST: number;
  outputIGST: number;
  inputCGST: number;
  inputSGST: number;
  inputIGST: number;
  payableCGST: number;
  payableSGST: number;
  payableIGST: number;
  totalPayable: number;
} {
  const payableCGST = Math.max(0, sales.cgst - purchases.cgst);
  const payableSGST = Math.max(0, sales.sgst - purchases.sgst);
  const payableIGST = Math.max(0, sales.igst - purchases.igst);

  return {
    outputCGST: sales.cgst,
    outputSGST: sales.sgst,
    outputIGST: sales.igst,
    inputCGST: purchases.cgst,
    inputSGST: purchases.sgst,
    inputIGST: purchases.igst,
    payableCGST: Number(payableCGST.toFixed(2)),
    payableSGST: Number(payableSGST.toFixed(2)),
    payableIGST: Number(payableIGST.toFixed(2)),
    totalPayable: Number((payableCGST + payableSGST + payableIGST).toFixed(2)),
  };
}
