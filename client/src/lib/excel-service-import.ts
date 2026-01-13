/**
 * Excel Import/Export Service for Services
 * Handles parsing Excel files and bulk operations
 */

import * as XLSX from 'xlsx';
import type { Service } from '@shared/schema';

// Service template column headers
export const SERVICE_EXCEL_COLUMNS = [
    'Name',           // Required
    'Category',       // Required
    'Price',          // Required (number)
    'Duration',       // Required (e.g., "2-3 Days", "Same Day")
    'Description',    // Optional
    'Status',         // Optional (Active/Inactive, default: Active)
];

// Sample data for template
const SAMPLE_SERVICES = [
    {
        Name: 'Wash & Fold',
        Category: 'Laundry',
        Price: 60,
        Duration: '2-3 Days',
        Description: 'Basic wash and fold service for everyday clothes',
        Status: 'Active',
    },
    {
        Name: 'Dry Cleaning - Suit',
        Category: 'Dry Cleaning',
        Price: 350,
        Duration: '3-4 Days',
        Description: 'Professional dry cleaning for suits and formal wear',
        Status: 'Active',
    },
    {
        Name: 'Iron Only',
        Category: 'Ironing',
        Price: 15,
        Duration: 'Same Day',
        Description: 'Steam ironing for pre-washed garments',
        Status: 'Active',
    },
    {
        Name: 'Stain Removal',
        Category: 'Special Care',
        Price: 100,
        Duration: '2-3 Days',
        Description: 'Treatment for difficult stains like oil, wine, ink',
        Status: 'Active',
    },
    {
        Name: 'Premium Saree',
        Category: 'Traditional',
        Price: 250,
        Duration: '4-5 Days',
        Description: 'Delicate cleaning for silk and designer sarees',
        Status: 'Active',
    },
];

export interface ParsedService {
    name: string;
    category: string;
    price: string;
    duration: string;
    description?: string;
    status: 'Active' | 'Inactive';
    isValid: boolean;
    errors: string[];
}

export interface ImportResult {
    success: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    parsedServices: ParsedService[];
    errors: string[];
}

/**
 * Download sample Excel template for services
 */
export function downloadServiceTemplate(): void {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_SERVICES);

    // Set column widths
    ws['!cols'] = [
        { wch: 25 },  // Name
        { wch: 15 },  // Category
        { wch: 10 },  // Price
        { wch: 12 },  // Duration
        { wch: 50 },  // Description
        { wch: 10 },  // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Services');

    // Add instructions sheet
    const instructions = [
        { Instruction: '=== FabZClean Service Import Template ===' },
        { Instruction: '' },
        { Instruction: 'COLUMNS:' },
        { Instruction: '• Name (Required): Service name, e.g., "Wash & Fold"' },
        { Instruction: '• Category (Required): Service category, e.g., "Laundry", "Dry Cleaning"' },
        { Instruction: '• Price (Required): Numeric price in INR, e.g., 60' },
        { Instruction: '• Duration (Required): Processing time, e.g., "2-3 Days", "Same Day"' },
        { Instruction: '• Description (Optional): Detailed service description' },
        { Instruction: '• Status (Optional): "Active" or "Inactive" (default: Active)' },
        { Instruction: '' },
        { Instruction: 'NOTES:' },
        { Instruction: '• Delete sample rows before adding your data' },
        { Instruction: '• Prices should be numbers only (no ₹ symbol)' },
        { Instruction: '• Duplicate names will update existing services' },
        { Instruction: '• Leave empty rows will be skipped' },
        { Instruction: '' },
        { Instruction: 'CATEGORIES (Suggested):' },
        { Instruction: 'Laundry, Dry Cleaning, Ironing, Traditional, Special Care, Leather, Household' },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Download
    XLSX.writeFile(wb, 'FabZClean_Service_Template.xlsx');
}

/**
 * Parse an Excel file and validate service data
 */
export function parseServiceExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    resolve({
                        success: false,
                        totalRows: 0,
                        validRows: 0,
                        invalidRows: 0,
                        parsedServices: [],
                        errors: ['No sheets found in the Excel file'],
                    });
                    return;
                }

                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

                if (jsonData.length === 0) {
                    resolve({
                        success: false,
                        totalRows: 0,
                        validRows: 0,
                        invalidRows: 0,
                        parsedServices: [],
                        errors: ['No data rows found in the Excel file'],
                    });
                    return;
                }

                const parsedServices: ParsedService[] = [];
                const globalErrors: string[] = [];

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2; // +2 because row 1 is header, and index is 0-based
                    const errors: string[] = [];

                    // Extract and normalize values
                    const name = (row['Name'] || row['name'] || row['SERVICE NAME'] || row['Service Name'] || '').toString().trim();
                    const category = (row['Category'] || row['category'] || row['CATEGORY'] || '').toString().trim();
                    const priceRaw = row['Price'] || row['price'] || row['PRICE'] || '';
                    const duration = (row['Duration'] || row['duration'] || row['DURATION'] || '').toString().trim();
                    const description = (row['Description'] || row['description'] || row['DESCRIPTION'] || '').toString().trim();
                    const statusRaw = (row['Status'] || row['status'] || row['STATUS'] || 'Active').toString().trim();

                    // Skip completely empty rows
                    if (!name && !category && !priceRaw && !duration) {
                        return;
                    }

                    // Validate required fields
                    if (!name) {
                        errors.push(`Row ${rowNum}: Name is required`);
                    }
                    if (!category) {
                        errors.push(`Row ${rowNum}: Category is required`);
                    }
                    if (!priceRaw && priceRaw !== 0) {
                        errors.push(`Row ${rowNum}: Price is required`);
                    }
                    if (!duration) {
                        errors.push(`Row ${rowNum}: Duration is required`);
                    }

                    // Parse and validate price
                    let price = '0';
                    if (priceRaw !== undefined && priceRaw !== '') {
                        const numPrice = typeof priceRaw === 'number' ? priceRaw : parseFloat(priceRaw.toString().replace(/[^0-9.]/g, ''));
                        if (isNaN(numPrice) || numPrice < 0) {
                            errors.push(`Row ${rowNum}: Invalid price value "${priceRaw}"`);
                        } else {
                            price = numPrice.toFixed(2);
                        }
                    }

                    // Normalize status
                    const status = statusRaw.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

                    parsedServices.push({
                        name,
                        category,
                        price,
                        duration,
                        description: description || undefined,
                        status: status as 'Active' | 'Inactive',
                        isValid: errors.length === 0,
                        errors,
                    });

                    if (errors.length > 0) {
                        globalErrors.push(...errors);
                    }
                });

                const validRows = parsedServices.filter(s => s.isValid).length;
                const invalidRows = parsedServices.filter(s => !s.isValid).length;

                resolve({
                    success: validRows > 0,
                    totalRows: parsedServices.length,
                    validRows,
                    invalidRows,
                    parsedServices,
                    errors: globalErrors,
                });

            } catch (error) {
                console.error('Excel parsing error:', error);
                resolve({
                    success: false,
                    totalRows: 0,
                    validRows: 0,
                    invalidRows: 0,
                    parsedServices: [],
                    errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
                });
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convert parsed services to API-ready format
 */
export function convertToServiceData(parsed: ParsedService[]): Partial<Service>[] {
    return parsed
        .filter(s => s.isValid)
        .map(s => ({
            name: s.name,
            category: s.category,
            price: s.price,
            duration: s.duration,
            description: s.description,
            status: s.status,
        }));
}
