/**
 * File Storage Service
 * Handles secure storage of PDFs, images, bills, invoices, and other files
 * with proper mapping to database records
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// Define storage paths - uses DATA_STORAGE_PATH if available
const BASE_STORAGE_PATH = process.env.DATA_STORAGE_PATH
    ? path.join(process.env.DATA_STORAGE_PATH, 'files')
    : path.join(process.cwd(), 'server', 'uploads');

// File category directories
const FILE_CATEGORIES = {
    invoices: 'invoices',
    bills: 'bills',
    receipts: 'receipts',
    barcodes: 'barcodes',
    signatures: 'signatures',
    documents: 'documents',
    images: 'images',
    reports: 'reports',
    temp: 'temp',
} as const;

type FileCategory = keyof typeof FILE_CATEGORIES;

export interface StoredFile {
    fileId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    path: string;
    relativePath: string;
    url: string;
    category: FileCategory;
    checksum: string;
    createdAt: Date;
}

export interface FileMetadata {
    entityType?: string;
    entityId?: string;
    orderId?: string;
    orderNumber?: string;
    customerId?: string;
    employeeId?: string;
    franchiseId?: string;
    description?: string;
    tags?: string[];
}

/**
 * Initialize file storage directories
 */
export function initializeFileStorage(): void {
    // Create base directory
    if (!fs.existsSync(BASE_STORAGE_PATH)) {
        fs.mkdirSync(BASE_STORAGE_PATH, { recursive: true });
}

    // Create category subdirectories
    for (const category of Object.values(FILE_CATEGORIES)) {
        const categoryPath = path.join(BASE_STORAGE_PATH, category);
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }
    }

    // Create year/month subdirectories for invoices and bills
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    for (const category of ['invoices', 'bills', 'receipts', 'reports']) {
        const datePath = path.join(BASE_STORAGE_PATH, category, year, month);
        if (!fs.existsSync(datePath)) {
            fs.mkdirSync(datePath, { recursive: true });
        }
    }
}

/**
 * Generate a unique filename with timestamp and UUID
 */
function generateStoredName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const uuid = randomUUID().split('-')[0]; // Short UUID
    return `${timestamp}_${uuid}${ext}`;
}

/**
 * Calculate MD5 checksum for file integrity
 */
function calculateChecksum(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return createHash('md5').update(content).digest('hex');
}

/**
 * Get the storage path for a category
 */
function getCategoryPath(category: FileCategory, useDate: boolean = false): string {
    let categoryPath = path.join(BASE_STORAGE_PATH, FILE_CATEGORIES[category]);

    if (useDate && ['invoices', 'bills', 'receipts', 'reports'].includes(category)) {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        categoryPath = path.join(categoryPath, year, month);

        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }
    }

    return categoryPath;
}

/**
 * Store a file from a buffer
 */
export async function storeFileFromBuffer(
    buffer: Buffer,
    originalName: string,
    category: FileCategory,
    mimeType: string
): Promise<StoredFile> {
    const storedName = generateStoredName(originalName);
    const categoryPath = getCategoryPath(category, true);
    const fullPath = path.join(categoryPath, storedName);
    const relativePath = path.relative(BASE_STORAGE_PATH, fullPath);

    // Write file
    fs.writeFileSync(fullPath, buffer);

    // Calculate checksum
    const checksum = createHash('md5').update(buffer).digest('hex');

    const fileId = randomUUID();

    return {
        fileId,
        originalName,
        storedName,
        mimeType,
        size: buffer.length,
        path: fullPath,
        relativePath,
        url: `/api/files/${fileId}`,
        category,
        checksum,
        createdAt: new Date(),
    };
}

/**
 * Store a file from a base64 string
 */
export async function storeFileFromBase64(
    base64Data: string,
    originalName: string,
    category: FileCategory,
    mimeType: string
): Promise<StoredFile> {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    return storeFileFromBuffer(buffer, originalName, category, mimeType);
}

/**
 * Store a file from an existing path (move/copy)
 */
export async function storeFileFromPath(
    sourcePath: string,
    originalName: string,
    category: FileCategory,
    mimeType: string,
    move: boolean = true
): Promise<StoredFile> {
    const storedName = generateStoredName(originalName);
    const categoryPath = getCategoryPath(category, true);
    const fullPath = path.join(categoryPath, storedName);
    const relativePath = path.relative(BASE_STORAGE_PATH, fullPath);

    if (move) {
        fs.renameSync(sourcePath, fullPath);
    } else {
        fs.copyFileSync(sourcePath, fullPath);
    }

    const stats = fs.statSync(fullPath);
    const checksum = calculateChecksum(fullPath);
    const fileId = randomUUID();

    return {
        fileId,
        originalName,
        storedName,
        mimeType,
        size: stats.size,
        path: fullPath,
        relativePath,
        url: `/api/files/${fileId}`,
        category,
        checksum,
        createdAt: new Date(),
    };
}

/**
 * Read a file by its stored path
 */
export function readFile(relativePath: string): Buffer | null {
    const fullPath = path.join(BASE_STORAGE_PATH, relativePath);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    return fs.readFileSync(fullPath);
}

/**
 * Delete a file
 */
export function deleteFile(relativePath: string): boolean {
    const fullPath = path.join(BASE_STORAGE_PATH, relativePath);

    if (!fs.existsSync(fullPath)) {
        return false;
    }

    try {
        fs.unlinkSync(fullPath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Archive a file (move to archive folder)
 */
export function archiveFile(relativePath: string): string | null {
    const fullPath = path.join(BASE_STORAGE_PATH, relativePath);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const archivePath = path.join(BASE_STORAGE_PATH, 'archive');
    if (!fs.existsSync(archivePath)) {
        fs.mkdirSync(archivePath, { recursive: true });
    }

    const filename = path.basename(relativePath);
    const archivedPath = path.join(archivePath, filename);

    fs.renameSync(fullPath, archivedPath);

    return path.relative(BASE_STORAGE_PATH, archivedPath);
}

/**
 * Get file info without reading content
 */
export function getFileInfo(relativePath: string): { size: number; mtime: Date } | null {
    const fullPath = path.join(BASE_STORAGE_PATH, relativePath);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const stats = fs.statSync(fullPath);
    return {
        size: stats.size,
        mtime: stats.mtime,
    };
}

/**
 * List files in a category
 */
export function listFiles(category: FileCategory, limit: number = 100): string[] {
    const categoryPath = getCategoryPath(category, false);

    if (!fs.existsSync(categoryPath)) {
        return [];
    }

    const files: string[] = [];

    function walkDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (files.length >= limit) break;

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else if (entry.isFile()) {
                files.push(path.relative(BASE_STORAGE_PATH, fullPath));
            }
        }
    }

    walkDir(categoryPath);

    return files;
}

/**
 * Clean up old temp files
 */
export function cleanupTempFiles(maxAgeHours: number = 24): number {
    const tempPath = path.join(BASE_STORAGE_PATH, FILE_CATEGORIES.temp);

    if (!fs.existsSync(tempPath)) {
        return 0;
    }

    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();
    let deletedCount = 0;

    const files = fs.readdirSync(tempPath);

    for (const file of files) {
        const filePath = path.join(tempPath, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAgeMs) {
            try {
                fs.unlinkSync(filePath);
                deletedCount++;
            } catch (error) {
                console.error(`Failed to delete temp file: ${file}`, error);
            }
        }
    }

    if (deletedCount > 0) {
}

    return deletedCount;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, { files: number; size: number }>;
} {
    const stats = {
        totalFiles: 0,
        totalSize: 0,
        byCategory: {} as Record<string, { files: number; size: number }>,
    };

    for (const category of Object.values(FILE_CATEGORIES)) {
        const categoryPath = path.join(BASE_STORAGE_PATH, category);

        if (!fs.existsSync(categoryPath)) {
            stats.byCategory[category] = { files: 0, size: 0 };
            continue;
        }

        let categoryFiles = 0;
        let categorySize = 0;

        function walkDir(dir: string) {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        walkDir(fullPath);
                    } else if (entry.isFile()) {
                        categoryFiles++;
                        categorySize += fs.statSync(fullPath).size;
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        }

        walkDir(categoryPath);

        stats.byCategory[category] = { files: categoryFiles, size: categorySize };
        stats.totalFiles += categoryFiles;
        stats.totalSize += categorySize;
    }

    return stats;
}

// Export constants
export const STORAGE_PATH = BASE_STORAGE_PATH;
export const CATEGORIES = FILE_CATEGORIES;
