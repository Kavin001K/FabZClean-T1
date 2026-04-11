import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const r2Endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined);

const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

const invoiceBucket = process.env.R2_INVOICE_BUCKET || 'invoice-pdf';
const assetsBucket = process.env.R2_ASSETS_BUCKET || 'assets';

const invoicePublicBaseUrl = process.env.R2_INVOICE_PUBLIC_BASE_URL || '';
const assetsPublicBaseUrl = process.env.R2_ASSETS_PUBLIC_BASE_URL || '';

const r2Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: r2AccessKeyId && r2SecretAccessKey ? {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
    } : undefined,
    forcePathStyle: true,
});

function requireR2Config(): void {
    if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
        throw new Error('R2 configuration missing. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
    }
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildPublicUrl(baseUrl: string, bucket: string, key: string): string {
    if (baseUrl) {
        return `${baseUrl.replace(/\/$/, '')}/${key}`;
    }
    if (!r2Endpoint) {
        return key;
    }
    const endpoint = r2Endpoint.replace(/\/$/, '');
    return `${endpoint}/${bucket}/${key}`;
}

function stripInvoicePublicPrefix(value: string): string | null {
    if (!value) return null;

    const normalized = value.trim();
    if (!normalized) return null;

    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        return normalized.replace(/^\/+/, '');
    }

    const knownPrefixes = [
        invoicePublicBaseUrl,
        `${r2Endpoint || ''}/${invoiceBucket}`,
    ].filter(Boolean).map((prefix) => prefix.replace(/\/$/, ''));

    for (const prefix of knownPrefixes) {
        if (normalized.startsWith(prefix)) {
            return normalized.slice(prefix.length).replace(/^\/+/, '');
        }
    }

    try {
        const parsed = new URL(normalized);
        return parsed.pathname.replace(new RegExp(`^/${invoiceBucket}/?`), '').replace(/^\/+/, '');
    } catch {
        return null;
    }
}

async function uploadBuffer(params: {
    bucket: string;
    key: string;
    buffer: Buffer;
    contentType: string;
}): Promise<string> {
    requireR2Config();

    const command = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
    });

    await r2Client.send(command);

    const baseUrl = params.bucket === assetsBucket
        ? assetsPublicBaseUrl
        : invoicePublicBaseUrl;

    return buildPublicUrl(baseUrl, params.bucket, params.key);
}

export const R2Storage = {
    async uploadInvoicePdf(orderId: string, buffer: Buffer): Promise<{ key: string; url: string }> {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const safeOrderId = sanitizeFilename(orderId || 'invoice');
        const key = `invoices/${year}/${month}/invoice-${safeOrderId}-${Date.now()}.pdf`;

        const url = await uploadBuffer({
            bucket: invoiceBucket,
            key,
            buffer,
            contentType: 'application/pdf',
        });

        return { key, url };
    },

    async uploadDocumentPdf(originalName: string, buffer: Buffer): Promise<{ key: string; url: string }> {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sanitizedOriginal = sanitizeFilename(originalName || 'document.pdf');
        const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const key = `documents/${year}/${month}/${uniquePrefix}-${sanitizedOriginal}`;

        const url = await uploadBuffer({
            bucket: invoiceBucket,
            key,
            buffer,
            contentType: 'application/pdf',
        });

        return { key, url };
    },

    async deleteInvoiceObject(keyOrUrl: string): Promise<boolean> {
        requireR2Config();

        const key = stripInvoicePublicPrefix(keyOrUrl);
        if (!key) {
            return false;
        }

        await r2Client.send(new DeleteObjectCommand({
            Bucket: invoiceBucket,
            Key: key,
        }));

        return true;
    },
};
