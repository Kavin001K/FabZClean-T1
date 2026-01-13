// server/utils/item-summarizer.ts
// Smart Item Summarization Utility for WhatsApp Messages (Server-side)

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
 * Extract item name from various possible properties
 */
export function getItemName(item: SummarizableItem | null | undefined): string {
    if (!item) return "Item";

    const name = item.name ||
        item.productName ||
        item.serviceName ||
        item.description ||
        (item.product && item.product.name) ||
        "Item";

    return String(name).trim();
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
 * @param maxLength - Maximum character length for the summary
 * @returns A clean, readable summary string
 */
export function generateItemSummary(
    items: SummarizableItem[] | null | undefined,
    maxLength: number = 50
): string {
    // Handle empty or invalid items
    if (!items || !Array.isArray(items) || items.length === 0) {
        return "Laundry Items";
    }

    const itemCount = items.length;

    // Strategy 1: Single item - show full name
    if (itemCount === 1) {
        const name = getItemName(items[0]);
        return name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name;
    }

    // Strategy 2: Two items - show both with "&"
    if (itemCount === 2) {
        const item1 = getItemName(items[0]);
        const item2 = getItemName(items[1]);
        const combined = `${item1} & ${item2}`;

        // If combined is too long, fall back to "& 1 other" format
        if (combined.length > maxLength) {
            const truncatedItem1 = item1.substring(0, Math.max(10, maxLength - 12)) + "...";
            return `${truncatedItem1} & 1 other`;
        }

        return combined;
    }

    // Strategy 3: 3+ items - show first item + count
    const firstItem = getItemName(items[0]);
    const othersCount = itemCount - 1;
    const suffix = ` & ${othersCount} others`;

    // Truncate first item if summary is too long
    if (firstItem.length + suffix.length > maxLength) {
        const availableLength = Math.max(10, maxLength - suffix.length - 3);
        return firstItem.substring(0, availableLength) + "..." + suffix;
    }

    return `${firstItem}${suffix}`;
}

/**
 * Check if category approach should be used
 * Use category if items are very diverse (5+ unique types)
 */
export function shouldUseCategoryApproach(items: SummarizableItem[]): boolean {
    if (!items || items.length < 5) return false;

    const uniqueNames = new Set(items.map(item => getItemName(item)));
    return uniqueNames.size > 5;
}

/**
 * Get appropriate category text based on order content
 */
export function getCategoryText(items: SummarizableItem[]): string {
    if (!items || items.length === 0) return "Laundry Items";

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
    return generateItemSummary(items, maxLength);
}

export default {
    getItemName,
    generateItemSummary,
    smartItemSummary,
    shouldUseCategoryApproach,
    getCategoryText,
};
