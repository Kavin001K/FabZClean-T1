/**
 * Address Utility Functions
 * 
 * Provides standardized address parsing, formatting, and validation
 * for use across the application.
 * 
 * Standard Format: "Street, City, State, Country - Pincode"
 * Example: "1/85 Zamin Kottampatty, Pollachi, Tamil Nadu, India - 642123"
 */

// Default values for Indian addresses
const DEFAULT_STATE = 'Tamil Nadu';
const DEFAULT_COUNTRY = 'India';

export interface AddressParts {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    label?: string;
}

/**
 * Format address parts into a clean, comma-separated string
 * Format: "Street, City, State, Country - Pincode"
 */
export function formatAddress(parts: Partial<AddressParts>): string {
    const street = parts.street?.trim() || '';
    const city = parts.city?.trim() || '';
    const state = parts.state?.trim() || DEFAULT_STATE;
    const country = parts.country?.trim() || DEFAULT_COUNTRY;
    const pincode = parts.pincode?.trim() || '';

    const addressParts: string[] = [];

    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (country) addressParts.push(country);

    let address = addressParts.join(', ');

    // Add pincode at the end with dash separator
    if (pincode) {
        // Format pincode with space: 642 123
        const formattedPincode = pincode.length === 6
            ? `${pincode.slice(0, 3)} ${pincode.slice(3)}`
            : pincode;
        address += ` - ${formattedPincode}`;
    }

    return address || 'Address not provided';
}

/**
 * Parse address from various formats (string, JSON, object)
 * Returns standardized address parts
 */
export function parseAddress(address: unknown): AddressParts {
    const defaultParts: AddressParts = {
        street: '',
        city: '',
        state: DEFAULT_STATE,
        pincode: '',
        country: DEFAULT_COUNTRY,
        label: '',
    };

    if (!address) return defaultParts;

    // If it's already an AddressParts object
    if (typeof address === 'object' && address !== null && !Array.isArray(address)) {
        const obj = address as Record<string, unknown>;
        return {
            street: extractStreet(obj),
            city: String(obj.city || obj.City || '').trim(),
            state: String(obj.state || obj.State || DEFAULT_STATE).trim(),
            pincode: String(obj.pincode || obj.zip || obj.Pincode || obj.postalCode || '').trim(),
            country: String(obj.country || obj.Country || DEFAULT_COUNTRY).trim(),
            label: String(obj.label || obj.Label || '').trim(),
        };
    }

    // If it's a string, try to parse it
    if (typeof address === 'string') {
        const trimmed = address.trim();

        // Check if it's JSON
        if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            try {
                const parsed = JSON.parse(trimmed);

                // If array, use first address
                if (Array.isArray(parsed)) {
                    return parseAddress(parsed[0]);
                }

                return parseAddress(parsed);
            } catch {
                // Not valid JSON, treat as plain string
                return parseAddressString(trimmed);
            }
        }

        // Plain string
        return parseAddressString(trimmed);
    }

    // If it's an array, use first element
    if (Array.isArray(address) && address.length > 0) {
        return parseAddress(address[0]);
    }

    return defaultParts;
}

/**
 * Extract street from an object that might have nested street data
 */
function extractStreet(obj: Record<string, unknown>): string {
    // Direct street field
    if (typeof obj.street === 'string') {
        return obj.street.trim();
    }

    // line1 field
    if (typeof obj.line1 === 'string') {
        return obj.line1.trim();
    }

    // Nested street array
    if (Array.isArray(obj.street)) {
        const streets = obj.street
            .map((s: unknown) => {
                if (typeof s === 'string') return s;
                if (typeof s === 'object' && s !== null) {
                    const sObj = s as Record<string, unknown>;
                    return String(sObj.street || sObj.line1 || '');
                }
                return '';
            })
            .filter(Boolean);
        return streets.join(', ');
    }

    return '';
}

/**
 * Parse a plain address string back into parts
 * Handles format: "Street, City, State, Country - Pincode"
 */
function parseAddressString(address: string): AddressParts {
    const parts: AddressParts = {
        street: '',
        city: '',
        state: DEFAULT_STATE,
        pincode: '',
        country: DEFAULT_COUNTRY,
        label: '',
    };

    if (!address) return parts;

    // Extract pincode from end (e.g., "- 642 123" or "- 642123")
    const pincodeMatch = address.match(/\s*-\s*(\d{3}\s?\d{3})\s*$/);
    let mainAddress = address;

    if (pincodeMatch) {
        parts.pincode = pincodeMatch[1].replace(/\s/g, '');
        mainAddress = address.slice(0, pincodeMatch.index || address.length);
    }

    // Split by comma
    const segments = mainAddress.split(',').map(s => s.trim()).filter(Boolean);

    if (segments.length === 0) {
        parts.street = mainAddress.trim();
    } else if (segments.length === 1) {
        parts.street = segments[0];
    } else if (segments.length === 2) {
        parts.street = segments[0];
        parts.city = segments[1];
    } else if (segments.length === 3) {
        parts.street = segments[0];
        parts.city = segments[1];
        // Check if third is state or country
        if (segments[2].toLowerCase() === 'india') {
            parts.country = segments[2];
        } else {
            parts.state = segments[2];
        }
    } else if (segments.length >= 4) {
        parts.street = segments[0];
        parts.city = segments[1];
        parts.state = segments[2];
        parts.country = segments[3];
    }

    return parts;
}

/**
 * Parse any address format and return a formatted string
 * This is the main function to use for display purposes
 */
export function parseAndFormatAddress(address: unknown): string {
    const parts = parseAddress(address);
    return formatAddress(parts);
}

/**
 * Create address object for storage in database
 */
export function createAddressObject(parts: Partial<AddressParts>): AddressParts {
    return {
        street: parts.street?.trim() || '',
        city: parts.city?.trim() || '',
        state: parts.state?.trim() || DEFAULT_STATE,
        pincode: parts.pincode?.trim() || '',
        country: parts.country?.trim() || DEFAULT_COUNTRY,
        label: parts.label?.trim() || 'Primary Address',
    };
}

/**
 * Validate pincode (6 digits for India)
 */
export function isValidPincode(pincode: string): boolean {
    const cleaned = pincode.replace(/\s/g, '');
    return /^\d{6}$/.test(cleaned);
}

/**
 * Clean and format pincode
 */
export function formatPincode(pincode: string): string {
    const cleaned = pincode.replace(/\D/g, '');
    if (cleaned.length === 6) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return cleaned;
}
