/**
 * Franchise Configuration
 * This file contains all franchise-specific information for invoices, tags, and contact details.
 * NEW FRANCHISES: Add your franchise here following the existing pattern.
 */

export interface FranchiseBranchInfo {
    id: string;
    name: string;
    branchCode: string; // Used in Order IDs like POL-001, KIN-001
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    gstNumber: string; // GSTIN for GST invoices
    managerName?: string;
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
 * Generate a unique order number with franchise prefix
 * Format: BRANCHCODE-YYYYMMDD-XXXX (e.g., POL-20251209-0001)
 */
export function generateOrderNumber(franchiseId?: string | null): string {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const random = Math.floor(Math.random() * 9000 + 1000); // 4 digit random
    return `${branchCode}-${dateStr}-${random}`;
}

/**
 * Generate a unique transit ID
 * Format: TR-BRANCHCODE-TIMESTAMP (e.g., TR-POL-1765335084330)
 */
export function generateTransitId(franchiseId?: string | null): string {
    const franchise = getFranchiseById(franchiseId);
    const branchCode = franchise.branchCode;
    return `TR-${branchCode}-${Date.now()}`;
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
 * Get invoice company details for a franchise
 */
export function getInvoiceCompanyDetails(franchiseId?: string | null, enableGST: boolean = false) {
    const franchise = getFranchiseById(franchiseId);

    return {
        name: 'Fab Clean',
        branchName: franchise.name,
        address: getFormattedAddress(franchise),
        phone: franchise.phone,
        email: franchise.email || 'support@myfabclean.com',
        taxId: enableGST ? franchise.gstNumber : undefined,
        logo: '/assets/logo.webp',
    };
}
