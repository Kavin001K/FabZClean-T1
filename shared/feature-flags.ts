export const FeatureFlags = {
    // Toggle this to enable WhatsApp integration features
    WHATSAPP_INTEGRATION: false,

    // Toggle for new invoice design
    NEW_INVOICE_DESIGN: true,

    // Loyalty program features
    LOYALTY_PROGRAM: false,
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;

/**
 * Checks if a feature is enabled.
 * Can be extended to check environment variables or database settings.
 */
export const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
    return FeatureFlags[key];
};
