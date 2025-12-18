// client/src/lib/item-summarizer.ts
// Smart Item Summarization Utility for WhatsApp and Invoice Messages

/**
 * Item interface for summarization
 */
interface SummarizableItem {
    name?: string;
    productName?: string;
    description?: string;
    serviceName?: string;
    product?: { name?: string };
    [key: string]: any;
}

/**
 * Summarization options
 */
interface SummarizationOptions {
    maxLength?: number;           // Max character length for the summary
    fallbackText?: string;        // Fallback when no items
    useCategory?: boolean;        // Use category approach instead
    categoryText?: string;        // Category text if useCategory is true
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: SummarizationOptions = {
    maxLength: 50,
    fallbackText: "Laundry Items",
    useCategory: false,
    categoryText: "Premium Laundry Items",
};

/**
 * Extract item name from various possible properties
 * Tries multiple common property names to find the item name
 */
export function getItemName(item: SummarizableItem | null | undefined): string {
    if (!item) return "Item";

    // Try common property names in order of priority
    const name = item.name ||
        item.productName ||
        item.serviceName ||
        item.description ||
        (item.product && item.product.name) ||
        "Item";

    return String(name).trim();
}

/**
 * Truncate text to a maximum length while keeping it readable
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3).trim() + "...";
}

/**
 * Generate a smart summary of order items for WhatsApp messages
 * 
 * Strategies:
 * - 1 Item: Show full name (e.g., "Saree (Cotton)")
 * - 2 Items: Show both with & (e.g., "Saree (Cotton) & Shirt")
 * - 3+ Items: Show first + count (e.g., "Saree (Cotton) & 2 others")
 * 
 * @param items - Array of order items
 * @param options - Summarization options
 * @returns A clean, readable summary string
 */
export function generateItemSummary(
    items: SummarizableItem[] | null | undefined,
    options: SummarizationOptions = {}
): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Handle empty or invalid items
    if (!items || !Array.isArray(items) || items.length === 0) {
        return opts.fallbackText!;
    }

    // Category approach - if enabled, use generic category text
    if (opts.useCategory) {
        return opts.categoryText!;
    }

    const itemCount = items.length;

    // Strategy 1: Single item - show full name
    if (itemCount === 1) {
        const name = getItemName(items[0]);
        return opts.maxLength ? truncateText(name, opts.maxLength) : name;
    }

    // Strategy 2: Two items - show both with "&"
    if (itemCount === 2) {
        const item1 = getItemName(items[0]);
        const item2 = getItemName(items[1]);
        const combined = `${item1} & ${item2}`;

        // If combined is too long, fall back to "& 1 other" format
        if (opts.maxLength && combined.length > opts.maxLength) {
            return `${truncateText(item1, opts.maxLength! - 12)} & 1 other`;
        }

        return combined;
    }

    // Strategy 3: 3+ items - show first item + count
    const firstItem = getItemName(items[0]);
    const othersCount = itemCount - 1;
    const summary = `${firstItem} & ${othersCount} others`;

    // Truncate first item if summary is too long
    if (opts.maxLength && summary.length > opts.maxLength) {
        const availableLength = opts.maxLength - ` & ${othersCount} others`.length;
        return `${truncateText(firstItem, Math.max(10, availableLength))} & ${othersCount} others`;
    }

    return summary;
}

/**
 * Determine if items should use category approach based on item diversity
 * Use category if items are very mixed (more than 5 different types)
 */
export function shouldUseCategoryApproach(items: SummarizableItem[]): boolean {
    if (!items || items.length < 5) return false;

    // Get unique item names
    const uniqueNames = new Set(items.map(item => getItemName(item)));

    // If more than 5 unique items, use category
    return uniqueNames.size > 5;
}

/**
 * Get appropriate category text based on order content
 */
export function getCategoryText(items: SummarizableItem[]): string {
    if (!items || items.length === 0) return "Laundry Items";

    // Check for specific categories
    const itemNames = items.map(item => getItemName(item).toLowerCase());

    // Dry cleaning keywords
    const dryCleanKeywords = ["suit", "blazer", "coat", "silk", "leather", "wedding", "formal"];
    const hasDryCleaning = itemNames.some(name =>
        dryCleanKeywords.some(keyword => name.includes(keyword))
    );

    // Household keywords
    const householdKeywords = ["curtain", "bedsheet", "blanket", "carpet", "rug", "linen"];
    const hasHousehold = itemNames.some(name =>
        householdKeywords.some(keyword => name.includes(keyword))
    );

    if (hasDryCleaning) return "Dry Cleaning Order";
    if (hasHousehold) return "Household Linens";
    return "Premium Laundry Items";
}

/**
 * All-in-one smart summarization function
 * Automatically decides the best strategy based on items
 */
export function smartItemSummary(
    items: SummarizableItem[] | null | undefined,
    maxLength: number = 50
): string {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return "Laundry Items";
    }

    // If too many diverse items, use category approach
    if (shouldUseCategoryApproach(items)) {
        return getCategoryText(items);
    }

    // Otherwise use the standard summary approach
    return generateItemSummary(items, { maxLength });
}

export default {
    getItemName,
    generateItemSummary,
    smartItemSummary,
    shouldUseCategoryApproach,
    getCategoryText,
    truncateText,
};
