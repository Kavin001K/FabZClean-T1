import QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Barcode, InsertBarcode } from '../shared/schema';

export interface BarcodeOptions {
  type: 'qr' | 'barcode' | 'ean13' | 'code128';
  entityType: 'order' | 'shipment' | 'product';
  entityId: string;
  data?: any;
  size?: number;
  margin?: number;
}

export interface GeneratedBarcode {
  id: string;
  code: string;
  imagePath: string;
  imageData: string; // Base64 encoded image
  type: string;
  entityType: string;
  entityId: string;
}

export class BarcodeService {
  private static instance: BarcodeService;
  private barcodesDir: string;

  private constructor() {
    this.barcodesDir = join(process.cwd(), 'public', 'barcodes');
    this.ensureBarcodesDirectory();
  }

  public static getInstance(): BarcodeService {
    if (!BarcodeService.instance) {
      BarcodeService.instance = new BarcodeService();
    }
    return BarcodeService.instance;
  }

  private ensureBarcodesDirectory(): void {
    if (!existsSync(this.barcodesDir)) {
      mkdirSync(this.barcodesDir, { recursive: true });
    }
  }

  /**
   * Generate a unique code for the barcode
   */
  private generateUniqueCode(entityType: string, entityId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${entityType.toUpperCase()}-${entityId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Generate QR Code
   */
  private async generateQRCode(data: string, options: { size?: number; margin?: number } = {}): Promise<string> {
    const { size = 200, margin = 2 } = options;

    try {
      const qrDataURL = await QRCode.toDataURL(data, {
        width: size,
        margin: margin,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      return qrDataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Generate Barcode (Code128)
   */
  private generateLinearBarcode(data: string, options: { width?: number; height?: number } = {}): string {
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
  private saveImageToFile(imageData: string, filename: string): string {
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const filePath = join(this.barcodesDir, filename);

    try {
      writeFileSync(filePath, base64Data, 'base64');
      return `/barcodes/${filename}`;
    } catch (error) {
      throw new Error(`Failed to save image: ${error}`);
    }
  }

  /**
   * Generate barcode/QR code
   */
  public async generateBarcode(options: BarcodeOptions): Promise<GeneratedBarcode> {
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

    let imageData: string;
    let filename: string;

    // Generate image based on type
    switch (type) {
      case 'qr':
        imageData = await this.generateQRCode(dataString, { size, margin });
        filename = `qr_${code}.png`;
        break;
      case 'barcode':
      case 'code128':
        imageData = this.generateLinearBarcode(code, { width: size * 2, height: size });
        filename = `barcode_${code}.svg`;
        break;
      case 'ean13':
        // For EAN13, we'd typically use a specialized library
        imageData = this.generateLinearBarcode(code, { width: size * 2, height: size });
        filename = `ean13_${code}.svg`;
        break;
      default:
        throw new Error(`Unsupported barcode type: ${type}`);
    }

    // Save image to file system
    const imagePath = this.saveImageToFile(imageData, filename);

    // Generate unique ID
    const id = randomUUID();

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
  public async generateOrderBarcode(orderId: string, orderData?: any): Promise<GeneratedBarcode> {
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
  public async generateShipmentBarcode(shipmentId: string, shipmentData?: any): Promise<GeneratedBarcode> {
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
  public async generateProductBarcode(productId: string, productData?: any): Promise<GeneratedBarcode> {
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
  public decodeBarcodeData(encodedData: string): any {
    try {
      return JSON.parse(encodedData);
    } catch (error) {
      throw new Error(`Failed to decode barcode data: ${error}`);
    }
  }

  /**
   * Validate barcode code format
   */
  public validateBarcodeCode(code: string): boolean {
    // Basic validation - can be enhanced based on requirements
    const pattern = /^[A-Z]+-[A-Z0-9]+-\d+-[A-Z0-9]+$/;
    return pattern.test(code);
  }

  /**
   * Generate multiple barcodes for bulk operations
   */
  public async generateBulkBarcodes(
    items: Array<{ entityType: 'order' | 'shipment' | 'product'; entityId: string; data?: any }>
  ): Promise<GeneratedBarcode[]> {
    const results: GeneratedBarcode[] = [];

    for (const item of items) {
      try {
        const barcode = await this.generateBarcode({
          type: item.entityType === 'product' ? 'ean13' : 'qr',
          entityType: item.entityType,
          entityId: item.entityId,
          data: item.data
        });
        results.push(barcode);
      } catch (error) {
        console.error(`Failed to generate barcode for ${item.entityType}:${item.entityId}`, error);
      }
    }

    return results;
  }
}

// Export singleton instance
export const barcodeService = BarcodeService.getInstance();
