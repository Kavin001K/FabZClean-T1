/**
 * Franchise Configuration
 * This file contains all franchise-specific information for invoices, tags, and contact details.
 * NEW FRANCHISES: Add your franchise here following the existing pattern.
 */

// ==========================================
// PAYMENT CONFIGURATION (CENTRALIZED)
// ==========================================
export const PAYMENT_CONFIG = {
    // Primary UPI ID for all payment collections
    UPI_ID: '9886788858@pz',
    // Display name shown in UPI apps
    PAYEE_NAME: 'Fab Clean',
    // Currency
    CURRENCY: 'INR',
} as const;

/**
 * Generate UPI payment URL for QR code
 * @param amount - Payment amount
 * @param orderId - Order reference number
 * @param note - Payment note/description
 */
export function generateUPIUrl(amount: number, orderId?: string, note?: string): string {
    const params = new URLSearchParams();
    params.set('pa', PAYMENT_CONFIG.UPI_ID);
    params.set('pn', PAYMENT_CONFIG.PAYEE_NAME);
    params.set('am', amount.toFixed(2));
    params.set('cu', PAYMENT_CONFIG.CURRENCY);
    if (orderId) params.set('tr', orderId);
    if (note) params.set('tn', note);
    return `upi://pay?${params.toString()}`;
}
// ==========================================

export interface FranchiseBranchInfo {
    id: string;
    name: string;
    branchCode: string; // Used in Order IDs like POL-001, KIN-001
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    whatsappNumber?: string;
    email: string;

    // Legal & Tax
    gstNumber: string; // GSTIN for GST invoices
    gstEnabled?: boolean;
    gstRate?: string;
    sacCode?: string; // Service Accounting Code
    taxId?: string; // PAN Number
    legalEntityName?: string;

    // Banking (for invoice bank details)
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankAccountName?: string;
    bankBranch?: string;

    // UPI (for QR code payments)
    upiId?: string;
    upiDisplayName?: string;

    // Manager
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;

    // Operating Hours
    openingTime?: string;
    closingTime?: string;

    // Branding
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;

    // Operational Settings
    enableDelivery?: boolean;
    defaultDeliveryCharge?: string;
    enableExpressService?: boolean;
    expressServiceMultiplier?: string;
}

// Default company info (used when no franchise is specified)
export const DEFAULT_COMPANY_INFO: FranchiseBranchInfo = {
    id: 'default',
    name: 'FabZClean',
    branchCode: 'FAB',
    address: '#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram',
    city: 'Pollachi',
    state: 'Tamil Nadu',
    pincode: '642002',
    phone: '+91 93630 59595',
    email: 'support@myfabclean.com',
    gstNumber: '33AITPD3522F1ZK',
};

// All franchise branches
// To add a new franchise, simply add a new entry here
export const FRANCHISE_BRANCHES: Record<string, FranchiseBranchInfo> = {
    // Pollachi Branch (Main)
    'pollachi': {
        id: 'pollachi',
        name: 'FabZClean - Pollachi',
        branchCode: 'POL',
        address: '#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram',
        city: 'Pollachi',
        state: 'Tamil Nadu',
        pincode: '642002',
        phone: '+91 93630 59595',
        email: 'pollachi@myfabclean.com',
        gstNumber: '33AITPD3522F1ZK',
        managerName: 'Pollachi Branch Manager',
    },

    // Kinathukadavu Branch
    'kinathukadavu': {
        id: 'kinathukadavu',
        name: 'FabZClean - Kinathukadavu',
        branchCode: 'KIN',
        address: '#442/11, Opp MLA Office, Krishnasamypuram',
        city: 'Kinathukadavu',
        state: 'Tamil Nadu',
        pincode: '642109',
        phone: '+91 93637 19595',
        email: 'kinathukadavu@myfabclean.com',
        gstNumber: '33AITPD3522F1ZK', // Same GST for all branches under same entity
        managerName: 'Kinathukadavu Branch Manager',
    },

    // === ADD NEW FRANCHISES BELOW THIS LINE ===
    // Example:
    // 'coimbatore': {
    //   id: 'coimbatore',
    //   name: 'FabZClean - Coimbatore',
    //   branchCode: 'CBE',
    //   address: 'Your Address Here',
    //   city: 'Coimbatore',
    //   state: 'Tamil Nadu',
    //   pincode: '641001',
    //   phone: '+91 XXXXX XXXXX',
    //   email: 'coimbatore@myfabclean.com',
    //   gstNumber: '33XXXXXXXXXX',
    // },
};

/**
 * Get franchise info by ID
 * Falls back to default if franchise not found
 */
export function getFranchiseById(franchiseId?: string | null): FranchiseBranchInfo {
    if (!franchiseId) {
        return DEFAULT_COMPANY_INFO;
    }

    // Normalize franchise ID to lowercase for matching
    const normalizedId = franchiseId.toLowerCase().trim();

    // Try exact match first
    if (FRANCHISE_BRANCHES[normalizedId]) {
        return FRANCHISE_BRANCHES[normalizedId];
    }

    // Try partial match (e.g., "FR-001" might match "pollachi")
    const matchingBranch = Object.values(FRANCHISE_BRANCHES).find(branch =>
        branch.id.toLowerCase() === normalizedId ||
        branch.branchCode.toLowerCase() === normalizedId ||
        franchiseId.toLowerCase().includes(branch.id.toLowerCase()) ||
        franchiseId.toLowerCase().includes(branch.branchCode.toLowerCase())
    );

    return matchingBranch || DEFAULT_COMPANY_INFO;
}

/**
 * Get franchise info for invoice by order's franchise ID
 */
export function getFranchiseForInvoice(order: any): FranchiseBranchInfo {
    // Try to get franchise from order
    const franchiseId = order?.franchiseId || order?.franchise_id;
    return getFranchiseById(franchiseId);
}

/**
 * Generate a unique order number with new format
 * Format: FZC-YYYY+BRANCHCODE+NNNN+LETTER
 * Example: FZC-2025POL0001A
 * 
 * Rules:
 * - FZC = FabZClean (constant)
 * - YYYY = Current year (2025, 2026, etc.)
 * - BRANCHCODE = Branch code (POL, KIN, etc.)
 * - NNNN = 4-digit sequential number (0001-9999)
 * - LETTER = A-Z suffix (starts with A, increments when NNNN reaches 9999)
 * 
 * When 9999A is reached, it rolls over to 0001B
 * When 9999Z is reached, it resets to new year or throws error
 */
export async function generateOrderNumber(franchiseId?: string | null, storage?: any): Promise<string> {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    const currentYear = new Date().getFullYear();

    // Generate the order number parts
    const prefix = 'FZC';

    // Get or create sequence for this branch and year
    let sequenceNumber = 1;
    let suffixLetter = 'A';

    // Try to get the latest order number from the database for this branch
    try {
        if (storage && storage.supabase) {
            // Query the order_sequences table for current sequence
            const { data: seqData, error: seqError } = await storage.supabase
                .from('order_sequences')
                .select('*')
                .eq('branch_code', branchCode)
                .eq('year', currentYear)
                .single();

            if (seqData && !seqError) {
                sequenceNumber = seqData.sequence_number + 1;
                suffixLetter = seqData.suffix_letter || 'A';

                // Check for rollover
                if (sequenceNumber > 9999) {
                    sequenceNumber = 1;
                    suffixLetter = String.fromCharCode(suffixLetter.charCodeAt(0) + 1);

                    // If we exceeded Z, start over with warning (should rarely happen)
                    if (suffixLetter > 'Z') {
                        console.error('[ORDER] Sequence overflow! Starting from A again.');
                        suffixLetter = 'A';
                    }
                }

                // Update the sequence
                await storage.supabase
                    .from('order_sequences')
                    .update({
                        sequence_number: sequenceNumber,
                        suffix_letter: suffixLetter,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', seqData.id);
            } else {
                // No sequence exists, create one
                await storage.supabase
                    .from('order_sequences')
                    .insert({
                        branch_code: branchCode,
                        year: currentYear,
                        sequence_number: 1,
                        suffix_letter: 'A'
                    });
            }
        } else {
            // Fallback: Use timestamp-based sequence (for when storage is not available)
            // This ensures uniqueness even without database
            const timestamp = Date.now();
            const lastFour = timestamp % 9999 + 1;
            sequenceNumber = lastFour;
        }
    } catch (error) {
        console.warn('[ORDER] Failed to get sequence from database, using fallback:', error);
        // Fallback: Use timestamp-based sequence
        const timestamp = Date.now();
        sequenceNumber = (timestamp % 9999) + 1;
    }

    // Format the order number
    const paddedSequence = String(sequenceNumber).padStart(4, '0');
    return `${prefix}-${currentYear}${branchCode}${paddedSequence}${suffixLetter}`;
}

/**
 * Synchronous version for cases where async is not possible
 * Uses timestamp-based fallback
 */
export function generateOrderNumberSync(franchiseId?: string | null): string {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    const currentYear = new Date().getFullYear();

    // Use timestamp for uniqueness
    const timestamp = Date.now();
    const sequence = (timestamp % 9999) + 1;
    const paddedSequence = String(sequence).padStart(4, '0');

    return `FZC-${currentYear}${branchCode}${paddedSequence}A`;
}

/**
 * Generate a unique transit ID with new format
 * Format: TRN-YYYY+BRANCHCODE+NNN+LETTER-DIRECTION
 * Example: TRN-2025POL001A-F (To Factory) or TRN-2025POL001A-S (To Store)
 * 
 * Rules:
 * - TRN = Transit (constant)
 * - YYYY = Current year
 * - BRANCHCODE = Origin branch code (POL, KIN, etc.)
 * - NNN = 3-digit sequential number (001-999)
 * - LETTER = A-Z suffix (increments when NNN reaches 999)
 * - DIRECTION = F (To Factory) or S (Return to Store)
 */
export function generateTransitId(
    franchiseId?: string | null,
    transitType: 'To Factory' | 'Return to Store' | string = 'To Factory'
): string {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    const currentYear = new Date().getFullYear();

    // Direction indicator
    const direction = transitType === 'To Factory' || transitType === 'store_to_factory' ? 'F' : 'S';

    // Generate sequence (using timestamp for uniqueness)
    const timestamp = Date.now();
    const sequence = (timestamp % 999) + 1;
    const paddedSequence = String(sequence).padStart(3, '0');

    // Use milliseconds for suffix to ensure uniqueness
    const suffixIndex = Math.floor((timestamp / 1000) % 26);
    const suffix = String.fromCharCode(65 + suffixIndex); // A-Z

    return `TRN-${currentYear}${branchCode}${paddedSequence}${suffix}-${direction}`;
}

/**
 * Parse transit ID to extract components
 */
export function parseTransitId(transitId: string): {
    prefix: string;
    year: number;
    branchCode: string;
    sequence: number;
    suffix: string;
    direction: 'F' | 'S';
} | null {
    // Format: TRN-2025POL001A-F
    const match = transitId.match(/^TRN-(\d{4})([A-Z]{3})(\d{3})([A-Z])-([FS])$/);
    if (!match) return null;

    return {
        prefix: 'TRN',
        year: parseInt(match[1]),
        branchCode: match[2],
        sequence: parseInt(match[3]),
        suffix: match[4],
        direction: match[5] as 'F' | 'S'
    };
}

/**
 * Generate a unique item barcode for garment tags
 * Format: ORDERNUM-ITEMINDEX-RANDOM (e.g., POL-20251209-0001-01-A3B2)
 * This ensures each physical garment has a unique trackable code
 */
export function generateItemBarcode(orderNumber: string, itemIndex: number): string {
    const paddedIndex = String(itemIndex + 1).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${orderNumber}-${paddedIndex}-${randomSuffix}`;
}

/**
 * Generate a unique service code
 * Format: SVC-BRANCHCODE-XXXX (e.g., SVC-POL-0001)
 */
export function generateServiceCode(franchiseId?: string | null): string {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `SVC-${branchCode}-${random}`;
}

/**
 * Generate a unique customer ID
 * Format: CUS-BRANCHCODE-TIMESTAMP (e.g., CUS-POL-1765335084330)
 */
export function generateCustomerId(franchiseId?: string | null): string {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    return `CUS-${branchCode}-${Date.now()}`;
}

/**
 * Get formatted address for display
 */
export function getFormattedAddress(franchise: FranchiseBranchInfo): string {
    return `${franchise.address}\n${franchise.city} - ${franchise.pincode}\n${franchise.state}, India`;
}

/**
 * Convert database franchise record to FranchiseBranchInfo
 */
export function convertDbFranchiseToInfo(dbFranchise: any): FranchiseBranchInfo {
    const address = dbFranchise.address || {};
    return {
        id: dbFranchise.id,
        name: dbFranchise.name,
        branchCode: dbFranchise.branchCode || dbFranchise.franchiseId?.slice(0, 3)?.toUpperCase() || 'FAB',
        address: address.street || '',
        city: address.city || '',
        state: address.state || 'Tamil Nadu',
        pincode: address.pincode || address.zip || '',
        phone: dbFranchise.phone || '',
        whatsappNumber: dbFranchise.whatsappNumber,
        email: dbFranchise.email || '',

        // Legal & Tax
        gstNumber: dbFranchise.gstNumber || '',
        gstEnabled: dbFranchise.gstEnabled ?? true,
        gstRate: dbFranchise.gstRate || '18.00',
        sacCode: dbFranchise.sacCode || '9971',
        taxId: dbFranchise.taxId,
        legalEntityName: dbFranchise.legalEntityName,

        // Banking
        bankName: dbFranchise.bankName,
        bankAccountNumber: dbFranchise.bankAccountNumber,
        bankIfsc: dbFranchise.bankIfsc,
        bankAccountName: dbFranchise.bankAccountName,
        bankBranch: dbFranchise.bankBranch,

        // UPI
        upiId: dbFranchise.upiId,
        upiDisplayName: dbFranchise.upiDisplayName,

        // Manager
        managerName: dbFranchise.managerName,
        managerPhone: dbFranchise.managerPhone,
        managerEmail: dbFranchise.managerEmail,

        // Operating Hours
        openingTime: dbFranchise.openingTime,
        closingTime: dbFranchise.closingTime,

        // Branding
        logoUrl: dbFranchise.logoUrl,
        primaryColor: dbFranchise.primaryColor,
        secondaryColor: dbFranchise.secondaryColor,

        // Operational
        enableDelivery: dbFranchise.enableDelivery,
        defaultDeliveryCharge: dbFranchise.defaultDeliveryCharge,
        enableExpressService: dbFranchise.enableExpressService,
        expressServiceMultiplier: dbFranchise.expressServiceMultiplier,
    };
}

/**
 * Get invoice company details for a franchise
 * Now includes banking details for wire transfer and UPI for QR code
 */
export function getInvoiceCompanyDetails(franchiseId?: string | null, enableGST: boolean = false) {
    const franchise = getFranchiseById(franchiseId);

    // Use franchise UPI or fallback to default
    const upiId = franchise.upiId || PAYMENT_CONFIG.UPI_ID;
    const upiDisplayName = franchise.upiDisplayName || PAYMENT_CONFIG.PAYEE_NAME;

    return {
        // Basic Info
        name: 'Fab Clean',
        branchName: franchise.name,
        address: getFormattedAddress(franchise),
        phone: franchise.phone,
        whatsappNumber: franchise.whatsappNumber,
        email: franchise.email || 'support@myfabclean.com',
        logo: franchise.logoUrl || '/assets/logo.webp',

        // Tax Info
        taxId: enableGST ? franchise.gstNumber : undefined,
        gstNumber: franchise.gstNumber,
        gstRate: franchise.gstRate || '18.00',
        sacCode: franchise.sacCode || '9971',
        panNumber: franchise.taxId,
        legalEntityName: franchise.legalEntityName,

        // Banking Details (for wire transfer)
        bankDetails: franchise.bankName ? {
            bankName: franchise.bankName,
            accountNumber: franchise.bankAccountNumber,
            ifscCode: franchise.bankIfsc,
            accountName: franchise.bankAccountName,
            branch: franchise.bankBranch,
        } : null,

        // UPI Payment
        upi: {
            id: upiId,
            displayName: upiDisplayName,
        },

        // Manager Contact
        manager: franchise.managerName ? {
            name: franchise.managerName,
            phone: franchise.managerPhone,
            email: franchise.managerEmail,
        } : null,

        // Operating Hours
        operatingHours: {
            open: franchise.openingTime || '09:00',
            close: franchise.closingTime || '21:00',
        },

        // Branding
        branding: {
            primaryColor: franchise.primaryColor || '#4CAF50',
            secondaryColor: franchise.secondaryColor || '#2196F3',
        },
    };
}

/**
 * Generate UPI URL for a specific franchise
 */
export function generateFranchiseUPIUrl(
    franchiseId: string | null | undefined,
    amount: number,
    orderId?: string,
    note?: string
): string {
    const franchise = getFranchiseById(franchiseId);
    const upiId = franchise.upiId || PAYMENT_CONFIG.UPI_ID;
    const payeeName = franchise.upiDisplayName || PAYMENT_CONFIG.PAYEE_NAME;

    const params = new URLSearchParams();
    params.set('pa', upiId);
    params.set('pn', payeeName);
    params.set('am', amount.toFixed(2));
    params.set('cu', PAYMENT_CONFIG.CURRENCY);
    if (orderId) params.set('tr', orderId);
    if (note) params.set('tn', note);
    return `upi://pay?${params.toString()}`;
}
