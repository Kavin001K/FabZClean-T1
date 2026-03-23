import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Helper to get configuration dynamically to avoid ESM initialization order issues
function getR2Config() {
    const r2Endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined);

    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    const invoiceBucket = process.env.R2_INVOICE_BUCKET || 'invoice-pdf';
    const assetsBucket = process.env.R2_ASSETS_BUCKET || 'assets';

    const invoicePublicBaseUrl = process.env.R2_INVOICE_PUBLIC_BASE_URL || '';
    const assetsPublicBaseUrl = process.env.R2_ASSETS_PUBLIC_BASE_URL || '';

    return {
        r2Endpoint,
        r2AccessKeyId,
        r2SecretAccessKey,
        invoiceBucket,
        assetsBucket,
        invoicePublicBaseUrl,
        assetsPublicBaseUrl
    };
}

let client: S3Client | null = null;

function getR2Client() {
    if (client) return client;

    const config = getR2Config();
    if (!config.r2Endpoint || !config.r2AccessKeyId || !config.r2SecretAccessKey) {
        throw new Error('R2 configuration missing. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env');
    }

    client = new S3Client({
        region: 'auto',
        endpoint: config.r2Endpoint,
        credentials: {
            accessKeyId: config.r2AccessKeyId,
            secretAccessKey: config.r2SecretAccessKey,
        },
        // Cloudflare R2 prefers virtual-hosted-style but path-style works with account-id endpoints
        forcePathStyle: true,
    });

    return client;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildPublicUrl(baseUrl: string, bucket: string, key: string, endpoint?: string): string {
    if (baseUrl) {
        return `${baseUrl.replace(/\/$/, '')}/${key}`;
    }
    if (!endpoint) {
        return key;
    }
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    return `${cleanEndpoint}/${bucket}/${key}`;
}

async function uploadBuffer(params: {
    bucket: string;
    key: string;
    buffer: Buffer;
    contentType: string;
}): Promise<string> {
    const r2Client = getR2Client();
    const config = getR2Config();

    const command = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
    });

    await r2Client.send(command);

    const baseUrl = params.bucket === config.assetsBucket
        ? config.assetsPublicBaseUrl
        : config.invoicePublicBaseUrl;

    return buildPublicUrl(baseUrl, params.bucket, params.key, config.r2Endpoint);
}

export const R2Storage = {
    async uploadInvoicePdf(orderId: string, buffer: Buffer): Promise<{ key: string; url: string }> {
        const config = getR2Config();
        const safeOrderId = sanitizeFilename(orderId || 'invoice');
        
        // Simplified key for direct bucket access
        const key = `invoice-${safeOrderId}.pdf`;

        const url = await uploadBuffer({
            bucket: config.invoiceBucket,
            key,
            buffer,
            contentType: 'application/pdf',
        });

        return { key, url };
    },

    async uploadDocumentPdf(originalName: string, buffer: Buffer): Promise<{ key: string; url: string }> {
        const config = getR2Config();
        const sanitizedOriginal = sanitizeFilename(originalName || 'document.pdf');
        const key = `documents/${Date.now()}-${sanitizedOriginal}`;

        const url = await uploadBuffer({
            bucket: config.invoiceBucket,
            key,
            buffer,
            contentType: 'application/pdf',
        });

        return { key, url };
    },
};
