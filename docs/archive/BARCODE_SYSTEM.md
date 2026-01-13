# Barcode & QR Code System

## Overview

This system provides comprehensive barcode and QR code generation, scanning, and management capabilities for the FabZClean application. It supports multiple barcode types and integrates seamlessly with the shipment creation workflow.

## Features

### 🔍 **Barcode Scanning**
- **Camera-based QR code scanning** using device camera
- **Manual barcode entry** for direct code input
- **Scan history** to quickly reuse previously scanned codes
- **Real-time decoding** of barcode data

### 🏷️ **Barcode Generation**
- **QR Codes** for orders and shipments
- **Barcode formats** (Code128, EAN13) for products
- **Unique code generation** with timestamp and random components
- **Automatic image storage** on server

### 📦 **Shipment Integration**
- **Order selection** via barcode scanning
- **Bulk barcode generation** for multiple orders
- **Print-ready labels** with proper formatting
- **Barcode validation** and error handling

### 🖨️ **Printing & Export**
- **Print-optimized layouts** for sticker printing
- **Download functionality** for barcode images
- **Copy to clipboard** for easy sharing
- **Multiple format support** (PNG, SVG)

## Architecture

### Backend Components

#### 1. **Barcode Service** (`server/barcode-service.ts`)
```typescript
// Singleton service for barcode operations
const barcodeService = BarcodeService.getInstance();

// Generate QR code for order
const barcode = await barcodeService.generateOrderBarcode(orderId, data);

// Generate barcode for shipment
const shipmentBarcode = await barcodeService.generateShipmentBarcode(shipmentId, data);
```

#### 2. **Database Schema** (`shared/schema.ts`)
```sql
-- Barcodes table
CREATE TABLE barcodes (
  id VARCHAR PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'qr', 'barcode', 'ean13', 'code128'
  entity_type TEXT NOT NULL, -- 'order', 'shipment', 'product'
  entity_id VARCHAR NOT NULL,
  data JSONB,
  image_path TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **API Endpoints**
- `GET /api/barcodes` - List all barcodes
- `GET /api/barcodes/:id` - Get specific barcode
- `GET /api/barcodes/code/:code` - Find barcode by code
- `POST /api/barcodes/generate` - Generate custom barcode
- `POST /api/barcodes/generate/order/:orderId` - Generate order barcode
- `POST /api/barcodes/generate/shipment/:shipmentId` - Generate shipment barcode
- `POST /api/barcodes/decode` - Decode barcode data
- `DELETE /api/barcodes/:id` - Delete barcode

### Frontend Components

#### 1. **Barcode Scanner** (`client/src/components/barcode-scanner.tsx`)
```tsx
<BarcodeScanner
  onScan={(code) => handleBarcodeScan(code)}
  title="Scan Order QR Code"
  placeholder="Scan QR code or enter Order ID"
/>
```

#### 2. **Barcode Display** (`client/src/components/barcode-display.tsx`)
```tsx
<BarcodeDisplay
  barcode={barcodeData}
  onPrint={(barcode) => handlePrint(barcode)}
  onDownload={(barcode) => handleDownload(barcode)}
/>
```

## Usage Guide

### 1. **Creating Shipments with Barcode Scanning**

1. Navigate to the **Tracking** page
2. Click **"Create New Shipment"**
3. Click **"Show Scanner"** to open the barcode scanner
4. **Scan QR codes** or **manually enter** order IDs
5. **Generate barcodes** for selected orders
6. **Print labels** for shipment tracking

### 2. **Barcode Generation Workflow**

```typescript
// Generate barcode for an order
const response = await fetch('/api/barcodes/generate/order/ORDER_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    data: { 
      generatedFor: 'shipment',
      priority: 'high' 
    } 
  })
});

const barcode = await response.json();
// Returns: { id, code, imageData, imagePath, ... }
```

### 3. **Barcode Scanning Integration**

```typescript
const handleBarcodeScan = async (code: string) => {
  try {
    // Decode barcode to get order information
    const response = await fetch('/api/barcodes/decode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encodedData: code })
    });
    
    const { decodedData } = await response.json();
    if (decodedData.entityType === 'order') {
      // Add order to shipment
      handleOrderSelect(decodedData.entityId);
    }
  } catch (error) {
    console.error('Error processing barcode:', error);
  }
};
```

## Barcode Formats

### QR Codes
- **Format**: QR Code
- **Content**: JSON data with order/shipment information
- **Use Case**: Orders, Shipments
- **Size**: 200x200px (configurable)

### Barcodes
- **Format**: Code128, EAN13
- **Content**: Unique identifier string
- **Use Case**: Products, Inventory
- **Size**: 400x100px (configurable)

## Code Structure

### Unique Code Generation
```
Format: {ENTITY_TYPE}-{ENTITY_ID_SHORT}-{TIMESTAMP}-{RANDOM}
Example: ORDER-06c2947f-1757951291101-6azny1
```

### Barcode Data Structure
```json
{
  "code": "ORDER-06c2947f-1757951291101-6azny1",
  "entityType": "order",
  "entityId": "06c2947f-a468-4e69-890c-6d022251efff",
  "timestamp": "2025-09-15T15:48:11.101Z",
  "data": {
    "generatedFor": "shipment",
    "priority": "high"
  }
}
```

## File Storage

### Directory Structure
```
public/
└── barcodes/
    ├── qr_ORDER-06c2947f-1757951291101-6azny1.png
    ├── barcode_PRODUCT-abc123-1757951291102-def456.svg
    └── ...
```

### Image Formats
- **QR Codes**: PNG format (better for printing)
- **Barcodes**: SVG format (scalable vector graphics)

## Printing Integration

### Print Layout
```html
<div class="barcode-container">
  <h3>ORDER BARCODE</h3>
  <img src="data:image/png;base64,..." alt="QR Code" />
  <div class="barcode-info">
    <p><strong>Code:</strong> ORDER-06c2947f-1757951291101-6azny1</p>
    <p><strong>Type:</strong> QR</p>
    <p><strong>Entity ID:</strong> 06c2947f-a468-4e69-890c-6d022251efff</p>
    <p><strong>Generated:</strong> 2025-09-15 15:48:11</p>
  </div>
</div>
```

### Print Styles
- **Border**: 1px solid black
- **Padding**: 10px
- **Page break**: Avoid inside containers
- **Font**: Arial, sans-serif

## Security Considerations

### Data Validation
- **Input sanitization** for all barcode data
- **Code format validation** using regex patterns
- **Entity ID verification** against database

### Access Control
- **Authentication required** for barcode generation
- **Rate limiting** on generation endpoints
- **Audit logging** for barcode operations

## Performance Optimization

### Caching
- **Generated images** cached on server
- **Barcode data** cached in memory
- **CDN integration** for image delivery

### Batch Operations
- **Bulk generation** for multiple orders
- **Async processing** for large batches
- **Progress tracking** for long operations

## Troubleshooting

### Common Issues

#### 1. **Camera Not Working**
```typescript
// Check browser permissions
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera access granted'))
  .catch(error => console.error('Camera access denied:', error));
```

#### 2. **Barcode Generation Fails**
```typescript
// Check server logs for errors
// Verify QR code library installation
// Check file system permissions for image storage
```

#### 3. **Print Layout Issues**
```css
/* Ensure proper print styles */
@media print {
  .barcode-container {
    page-break-inside: avoid;
    border: 1px solid #000;
  }
}
```

## Future Enhancements

### Planned Features
- **Barcode validation** with external APIs
- **Batch printing** for multiple labels
- **Mobile app integration** for scanning
- **Analytics dashboard** for barcode usage
- **Integration with shipping carriers**

### API Extensions
- **Webhook support** for barcode events
- **GraphQL API** for complex queries
- **Real-time updates** via WebSocket
- **Export functionality** for bulk operations

## Dependencies

### Backend
- `qrcode` - QR code generation
- `jspdf` - PDF generation for printing
- `html2canvas` - HTML to image conversion
- `bwip-js` - Barcode generation

### Frontend
- `@tanstack/react-query` - Data fetching
- `lucide-react` - Icons
- `@radix-ui/react-*` - UI components

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install qrcode jspdf html2canvas bwip-js
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Navigate to tracking page**:
   ```
   http://localhost:3000/tracking
   ```

4. **Test barcode generation**:
   ```bash
   node scripts/generate-order-barcodes.js
   ```

5. **Create shipment with barcode scanning**:
   - Click "Create New Shipment"
   - Use barcode scanner to add orders
   - Generate and print barcodes

## Support

For issues or questions about the barcode system:
- Check the troubleshooting section above
- Review server logs for error details
- Test with the provided sample data
- Verify camera permissions in browser settings
