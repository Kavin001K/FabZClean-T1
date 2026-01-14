/**
 * Local File Storage Service
 * Handles all file operations for the FabZClean application
 * Saves files directly to server disk with automatic organization and optimization
 */

import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// Optional: Sharp for image optimization
// If not installed, falls back to raw file saving
let sharp: any = null;
try {
    sharp = require('sharp');
    console.log('✅ Sharp image optimizer loaded');
} catch (e) {
    console.warn('⚠️  Sharp not found. Images will be saved without optimization.');
    console.warn('   Install with: npm install sharp');
}

// Base upload directory - relative to project root
const UPLOAD_ROOT = path.join(process.cwd(), 'server', 'uploads');

/**
 * Ensure a directory exists, creating it recursively if needed
 */
function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
}

/**
 * Generate a unique filename with optional prefix
 */
function generateFilename(prefix: string, extension: string): string {
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    return `${prefix}-${timestamp}-${random}${extension}`;
}

/**
 * Get file extension from filename or MIME type
 */
function getExtension(filename: string, mimeType?: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (ext) return ext;

    // Fallback to MIME type
    const mimeExtensions: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
    };

    return mimeType ? (mimeExtensions[mimeType] || '.bin') : '.bin';
}

export const LocalStorage = {
    /**
     * Get the upload root path
     */
    getUploadRoot(): string {
        return UPLOAD_ROOT;
    },

    /**
     * Initialize storage directories
     * Call this on server startup
     */
    initialize(): void {
        const directories = [
            path.join(UPLOAD_ROOT, 'images', 'profiles'),
            path.join(UPLOAD_ROOT, 'images', 'products'),
            path.join(UPLOAD_ROOT, 'documents', 'invoices'),
            path.join(UPLOAD_ROOT, 'documents', 'reports'),
            path.join(UPLOAD_ROOT, 'temp'),
        ];

        directories.forEach(ensureDir);
        console.log(`📦 Local storage initialized at: ${UPLOAD_ROOT}`);
    },

    /**
     * Save a profile image with optimization
     * @param userId - User/Employee ID
     * @param buffer - File buffer
     * @param originalName - Original filename
     * @returns Public URL path
     */
    async saveProfileImage(userId: string | number, buffer: Buffer, originalName: string): Promise<string> {
        const dir = path.join(UPLOAD_ROOT, 'images', 'profiles');
        ensureDir(dir);

        // Always save as JPEG for consistency
        const filename = generateFilename(`user-${userId}`, '.jpg');
        const filepath = path.join(dir, filename);

        try {
            if (sharp) {
                // Optimize: Resize to max 500x500, convert to JPEG, quality 80%
                await sharp(buffer)
                    .resize(500, 500, {
                        fit: 'cover',
                        position: 'centre'
                    })
                    .jpeg({ quality: 80, progressive: true })
                    .toFile(filepath);

                console.log(`🖼️  Profile image saved (optimized): ${filename}`);
            } else {
                // Fallback: Save raw buffer
                await fs.promises.writeFile(filepath, buffer);
                console.log(`🖼️  Profile image saved (raw): ${filename}`);
            }

            return `/uploads/images/profiles/${filename}`;
        } catch (error) {
            console.error('❌ Failed to save profile image:', error);
            throw new Error('Image save failed');
        }
    },

    /**
     * Save a product/service image with optimization
     * @param itemId - Product/Service ID
     * @param buffer - File buffer
     * @param originalName - Original filename
     * @returns Public URL path
     */
    async saveProductImage(itemId: string | number, buffer: Buffer, originalName: string): Promise<string> {
        const dir = path.join(UPLOAD_ROOT, 'images', 'products');
        ensureDir(dir);

        const filename = generateFilename(`product-${itemId}`, '.jpg');
        const filepath = path.join(dir, filename);

        try {
            if (sharp) {
                await sharp(buffer)
                    .resize(800, 800, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 85, progressive: true })
                    .toFile(filepath);
            } else {
                await fs.promises.writeFile(filepath, buffer);
            }

            return `/uploads/images/products/${filename}`;
        } catch (error) {
            console.error('❌ Failed to save product image:', error);
            throw new Error('Image save failed');
        }
    },

    /**
     * Save a generated invoice PDF
     * Organizes by Year/Month to prevent folder overcrowding
     * @param orderId - Order ID
     * @param buffer - PDF buffer
     * @returns Public URL path
     */
    async saveInvoicePdf(orderId: string, buffer: Buffer): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const dir = path.join(UPLOAD_ROOT, 'documents', 'invoices', year, month);
        ensureDir(dir);

        const filename = `invoice-${orderId}-${Date.now()}.pdf`;
        const filepath = path.join(dir, filename);

        try {
            await fs.promises.writeFile(filepath, buffer);
            console.log(`📄 Invoice PDF saved: ${filename}`);

            return `/uploads/documents/invoices/${year}/${month}/${filename}`;
        } catch (error) {
            console.error('❌ Failed to save invoice PDF:', error);
            throw new Error('PDF save failed');
        }
    },

    /**
     * Save a report document
     * @param reportName - Report name/type
     * @param buffer - Document buffer
     * @param extension - File extension (.pdf, .xlsx, etc.)
     * @returns Public URL path
     */
    async saveReport(reportName: string, buffer: Buffer, extension: string = '.pdf'): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const dir = path.join(UPLOAD_ROOT, 'documents', 'reports', year, month);
        ensureDir(dir);

        const sanitizedName = reportName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
        const filename = `${sanitizedName}-${Date.now()}${extension}`;
        const filepath = path.join(dir, filename);

        try {
            await fs.promises.writeFile(filepath, buffer);
            console.log(`📊 Report saved: ${filename}`);

            return `/uploads/documents/reports/${year}/${month}/${filename}`;
        } catch (error) {
            console.error('❌ Failed to save report:', error);
            throw new Error('Report save failed');
        }
    },

    /**
     * Save a generic file
     * @param category - Category folder name
     * @param buffer - File buffer
     * @param originalName - Original filename
     * @returns Public URL path
     */
    async saveFile(category: string, buffer: Buffer, originalName: string): Promise<string> {
        const dir = path.join(UPLOAD_ROOT, category);
        ensureDir(dir);

        const ext = getExtension(originalName);
        const filename = generateFilename('file', ext);
        const filepath = path.join(dir, filename);

        try {
            await fs.promises.writeFile(filepath, buffer);
            return `/uploads/${category}/${filename}`;
        } catch (error) {
            console.error('❌ Failed to save file:', error);
            throw new Error('File save failed');
        }
    },

    /**
     * Delete a file from local storage
     * @param publicUrl - The public URL path (e.g., /uploads/images/profiles/xxx.jpg)
     */
    async deleteFile(publicUrl: string): Promise<boolean> {
        // Safety: Only delete files under /uploads
        if (!publicUrl || !publicUrl.startsWith('/uploads')) {
            console.warn('⚠️  Ignoring delete request for non-upload path:', publicUrl);
            return false;
        }

        const relativePath = publicUrl.replace('/uploads', '');
        const filepath = path.join(UPLOAD_ROOT, relativePath);

        try {
            if (fs.existsSync(filepath)) {
                await fs.promises.unlink(filepath);
                console.log(`🗑️  Deleted file: ${filepath}`);
                return true;
            } else {
                console.warn(`⚠️  File not found for deletion: ${filepath}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to delete file:', filepath, error);
            return false;
        }
    },

    /**
     * Check if a file exists
     * @param publicUrl - The public URL path
     */
    fileExists(publicUrl: string): boolean {
        if (!publicUrl || !publicUrl.startsWith('/uploads')) {
            return false;
        }

        const relativePath = publicUrl.replace('/uploads', '');
        const filepath = path.join(UPLOAD_ROOT, relativePath);

        return fs.existsSync(filepath);
    },

    /**
     * Get file stats
     * @param publicUrl - The public URL path
     */
    async getFileStats(publicUrl: string): Promise<fs.Stats | null> {
        if (!publicUrl || !publicUrl.startsWith('/uploads')) {
            return null;
        }

        const relativePath = publicUrl.replace('/uploads', '');
        const filepath = path.join(UPLOAD_ROOT, relativePath);

        try {
            return await fs.promises.stat(filepath);
        } catch {
            return null;
        }
    },

    /**
     * Clean up old temporary files (older than 24 hours)
     */
    async cleanupTempFiles(): Promise<number> {
        const tempDir = path.join(UPLOAD_ROOT, 'temp');
        if (!fs.existsSync(tempDir)) return 0;

        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        let deletedCount = 0;

        try {
            const files = await fs.promises.readdir(tempDir);

            for (const file of files) {
                const filepath = path.join(tempDir, file);
                const stats = await fs.promises.stat(filepath);

                if (stats.mtimeMs < oneDayAgo) {
                    await fs.promises.unlink(filepath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                console.log(`🧹 Cleaned up ${deletedCount} temp files`);
            }
        } catch (error) {
            console.error('❌ Temp cleanup error:', error);
        }

        return deletedCount;
    }
};

// Initialize on import
LocalStorage.initialize();
