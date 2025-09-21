"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.barcodeService = exports.BarcodeService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
class BarcodeService {
    constructor() {
        this.barcodesDir = (0, path_1.join)(process.cwd(), 'public', 'barcodes');
        this.ensureBarcodesDirectory();
    }
    static getInstance() {
        if (!BarcodeService.instance) {
            BarcodeService.instance = new BarcodeService();
        }
        return BarcodeService.instance;
    }
    ensureBarcodesDirectory() {
        if (!(0, fs_1.existsSync)(this.barcodesDir)) {
            (0, fs_1.mkdirSync)(this.barcodesDir, { recursive: true });
        }
    }
    /**
     * Generate a unique code for the barcode
     */
    generateUniqueCode(entityType, entityId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${entityType.toUpperCase()}-${entityId.substring(0, 8)}-${timestamp}-${random}`;
    }
    /**
     * Generate QR Code
     */
    async generateQRCode(data, options = {}) {
        const { size = 200, margin = 2 } = options;
        try {
            const qrDataURL = await qrcode_1.default.toDataURL(data, {
                width: size,
                margin: margin,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            return qrDataURL;
        }
        catch (error) {
            throw new Error(`Failed to generate QR code: ${error}`);
        }
    }
    /**
     * Generate Barcode (Code128)
     */
    generateBarcode(data, options = {}) {
        const { width = 200, height = 100 } = options;
        // For now, we'll use a simple text-based barcode representation
        // In production, you might want to use a library like bwip-js for actual barcode generation
        const canvas = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>
      <text x="10" y="${height / 2}" font-family="monospace" font-size="12" fill="black">${data}</text>
      <text x="10" y="${height / 2 + 20}" font-family="monospace" font-size="8" fill="black">BARCODE: ${data}</text>
    </svg>`;
        return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
    }
    /**
     * Save image to file system
     */
    saveImageToFile(imageData, filename) {
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const filePath = (0, path_1.join)(this.barcodesDir, filename);
        try {
            (0, fs_1.writeFileSync)(filePath, base64Data, 'base64');
            return `/barcodes/${filename}`;
        }
        catch (error) {
            throw new Error(`Failed to save image: ${error}`);
        }
    }
    /**
     * Generate barcode/QR code
     */
    async generateBarcode(options) {
        const { type, entityType, entityId, data, size = 200, margin = 2 } = options;
        // Generate unique code
        const code = this.generateUniqueCode(entityType, entityId);
        // Prepare data to encode
        const encodedData = {
            code,
            entityType,
            entityId,
            timestamp: new Date().toISOString(),
            ...data
        };
        const dataString = JSON.stringify(encodedData);
        let imageData;
        let filename;
        // Generate image based on type
        switch (type) {
            case 'qr':
                imageData = await this.generateQRCode(dataString, { size, margin });
                filename = `qr_${code}.png`;
                break;
            case 'barcode':
            case 'code128':
                imageData = this.generateBarcode(code, { width: size * 2, height: size });
                filename = `barcode_${code}.svg`;
                break;
            case 'ean13':
                // For EAN13, we'd typically use a specialized library
                imageData = this.generateBarcode(code, { width: size * 2, height: size });
                filename = `ean13_${code}.svg`;
                break;
            default:
                throw new Error(`Unsupported barcode type: ${type}`);
        }
        // Save image to file system
        const imagePath = this.saveImageToFile(imageData, filename);
        // Generate unique ID
        const id = (0, crypto_1.randomUUID)();
        return {
            id,
            code,
            imagePath,
            imageData,
            type,
            entityType,
            entityId
        };
    }
    /**
     * Generate barcode for an order
     */
    async generateOrderBarcode(orderId, orderData) {
        return this.generateBarcode({
            type: 'qr',
            entityType: 'order',
            entityId: orderId,
            data: orderData
        });
    }
    /**
     * Generate barcode for a shipment
     */
    async generateShipmentBarcode(shipmentId, shipmentData) {
        return this.generateBarcode({
            type: 'qr',
            entityType: 'shipment',
            entityId: shipmentId,
            data: shipmentData
        });
    }
    /**
     * Generate barcode for a product
     */
    async generateProductBarcode(productId, productData) {
        return this.generateBarcode({
            type: 'ean13',
            entityType: 'product',
            entityId: productId,
            data: productData
        });
    }
    /**
     * Decode barcode data
     */
    decodeBarcodeData(encodedData) {
        try {
            return JSON.parse(encodedData);
        }
        catch (error) {
            throw new Error(`Failed to decode barcode data: ${error}`);
        }
    }
    /**
     * Validate barcode code format
     */
    validateBarcodeCode(code) {
        // Basic validation - can be enhanced based on requirements
        const pattern = /^[A-Z]+-[A-Z0-9]+-\d+-[A-Z0-9]+$/;
        return pattern.test(code);
    }
    /**
     * Generate multiple barcodes for bulk operations
     */
    async generateBulkBarcodes(items) {
        const results = [];
        for (const item of items) {
            try {
                const barcode = await this.generateBarcode({
                    type: item.entityType === 'product' ? 'ean13' : 'qr',
                    entityType: item.entityType,
                    entityId: item.entityId,
                    data: item.data
                });
                results.push(barcode);
            }
            catch (error) {
                console.error(`Failed to generate barcode for ${item.entityType}:${item.entityId}`, error);
            }
        }
        return results;
    }
}
exports.BarcodeService = BarcodeService;
// Export singleton instance
exports.barcodeService = BarcodeService.getInstance();
//# sourceMappingURL=barcode-service.js.map