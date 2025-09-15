#!/usr/bin/env node

/**
 * Script to generate barcodes for existing orders
 * This can be run to pre-generate barcodes for all orders
 */

import fs from 'fs';
import path from 'path';

// Simple barcode generation for demonstration
function generateSimpleBarcode(code) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${code.toUpperCase()}-${timestamp}-${random}`;
}

// Generate barcodes for sample orders
const sampleOrders = [
  '06c2947f-a468-4e69-890c-6d022251efff',
  '2c311b49-af0b-416f-a542-017b6704f2cf'
];

console.log('🚀 Generating barcodes for existing orders...\n');

sampleOrders.forEach((orderId, index) => {
  const barcode = generateSimpleBarcode(orderId);
  console.log(`Order ${index + 1}:`);
  console.log(`  ID: ${orderId}`);
  console.log(`  Barcode: ${barcode}`);
  console.log(`  QR Data: ${JSON.stringify({
    code: barcode,
    entityType: 'order',
    entityId: orderId,
    timestamp: new Date().toISOString(),
    generatedBy: 'script'
  })}\n`);
});

console.log('✅ Barcode generation complete!');
console.log('\n📋 Next steps:');
console.log('1. Start the server: npm run dev');
console.log('2. Navigate to the tracking page');
console.log('3. Click "Create New Shipment"');
console.log('4. Use the barcode scanner to scan QR codes');
console.log('5. Generate and print barcodes for orders');
console.log('\n🔧 Features available:');
console.log('- QR code scanning with camera');
console.log('- Manual barcode entry');
console.log('- Barcode generation for orders');
console.log('- Print-ready barcode labels');
console.log('- Barcode history and management');
