import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { R2Storage } from '../server/services/r2-storage';

async function testUpload() {
    console.log('🚀 Starting R2 Upload Test...');
    console.log('Bucket:', process.env.R2_INVOICE_BUCKET || 'invoice-pdf');
    console.log('Endpoint:', process.env.R2_ENDPOINT);

    const dummyBuffer = Buffer.from('This is a test invoice PDF content generated at ' + new Date().toISOString());
    const orderNumber = 'TEST-' + Math.floor(Math.random() * 10000);

    try {
        const result = await R2Storage.uploadInvoicePdf(orderNumber, dummyBuffer);
        console.log('✅ Upload Successful!');
        console.log('Key:', result.key);
        console.log('URL:', result.url);
    } catch (error) {
        console.error('❌ Upload Failed!');
        console.error(error);
    }
}

testUpload();
