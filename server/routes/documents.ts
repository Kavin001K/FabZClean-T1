import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { R2Storage } from '../services/r2-storage';
import { LocalStorage } from '../services/local-storage';
import path from 'path';
import fs from 'fs';

const documentsDir = path.join(process.cwd(), 'server', 'uploads', 'documents');

const router = Router();

const serializeError = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
<<<<<<< Updated upstream
        const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';
        const isPdfName = /\.pdf$/i.test(file.originalname || '');
        if (isPdfMime || isPdfName) {
=======
        if (file.mimetype === 'application/pdf') {
>>>>>>> Stashed changes
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { type, metadata: metadataStr } = req.body;
        let metadata = {};
        try {
            metadata = metadataStr ? JSON.parse(metadataStr) : {};
        } catch (e) {
            console.warn('Failed to parse metadata JSON:', e);
        }

        const originalName = req.file.originalname;
        let filepath = "";
        let fileUrl = "";
        let storageUsed = "r2";

        // Try R2 upload first
        try {
            const r2Result = await R2Storage.uploadDocumentPdf(originalName, req.file.buffer);
            filepath = r2Result.key;
            fileUrl = r2Result.url;
            console.log(`✅ [Documents] Saved to R2: ${filepath}`);
        } catch (r2Error) {
            console.error('❌ [Documents] R2 Upload failed, falling back to LocalStorage:', r2Error instanceof Error ? r2Error.message : String(r2Error));
            
            // Fallback to Local Storage
            const localPath = await LocalStorage.saveFile('documents', req.file.buffer, originalName);
            filepath = localPath; // This is the /uploads/... path
            
            const baseUrl = process.env.APP_BASE_URL || `http://${req.get('host')}`;
            fileUrl = `${baseUrl.replace(/\/$/, '')}${localPath}`;
            storageUsed = "local";
            
            console.log(`✅ [Documents] Saved to LocalStorage (Fallback): ${filepath}`);
        }

        // Save document record to database
        try {
            const document = await db.createDocument({
                franchiseId: (req as any).user?.franchiseId,
                type: type || 'invoice',
                title: (metadata as any).invoiceNumber ? `Invoice ${(metadata as any).invoiceNumber}` : req.file.originalname,
                filename: originalName,
                fileUrl,
<<<<<<< Updated upstream
                filepath,
=======
>>>>>>> Stashed changes
                status: (metadata as any).status || 'sent',
                amount: (metadata as any).amount ? String((metadata as any).amount) : null,
                customerName: (metadata as any).customerName || null,
                orderNumber: (metadata as any).orderNumber || null,
<<<<<<< Updated upstream
                storeId: (metadata as any).storeId || null,
                templateKey: (metadata as any).templateKey || null,
=======
>>>>>>> Stashed changes
                metadata: {
                    filepath,
                    ...(metadata as any).metadata || {},
                    storage: storageUsed,
                    uploadedAt: new Date().toISOString()
                },
            });

            // Update order invoiceUrl if this was an invoice
            if ((type === 'invoice' || !type) && (metadata as any).orderNumber) {
                try {
                    const orderNum = (metadata as any).orderNumber;
                    const orders = await db.listOrders();
                    const order = orders.find((o: any) => o.orderNumber === orderNum);
                    if (order) {
                        await db.updateOrder(order.id, { invoiceUrl: fileUrl } as any);
                        console.log(`🔗 [Documents] Linked invoice URL to order: ${orderNum}`);
                    }
                } catch (linkErr) {
                    console.warn('[Documents] Failed to link invoice URL to order:', linkErr);
                }
            }

            res.json({
                success: true,
                document,
                storageUsed,
                message: 'Document uploaded successfully',
            });
        } catch (dbError) {
            console.error('Database insert error:', dbError);
<<<<<<< Updated upstream

            if ((type === 'invoice' || !type) && (metadata as any).orderNumber) {
                try {
                    const orderNum = (metadata as any).orderNumber;
                    const orders = await db.listOrders();
                    const order = orders.find((o: any) => o.orderNumber === orderNum);
                    if (order) {
                        await db.updateOrder(order.id, { invoiceUrl: fileUrl } as any);
                        console.log(`🔗 [Documents] Linked invoice URL to order without document row: ${orderNum}`);
                    }
                } catch (linkErr) {
                    console.warn('[Documents] Failed to link invoice URL after document row error:', linkErr);
                }
            }

            return res.json({
                success: true,
                warning: 'Document file uploaded, but metadata row could not be saved.',
                fileUrl,
                filepath,
                storageUsed,
                details: serializeError(dbError),
            });
=======
            return res.status(500).json({ error: 'Failed to save document record', details: dbError instanceof Error ? dbError.message : String(dbError) });
>>>>>>> Stashed changes
        }
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({
            error: 'Failed to upload document',
            details: serializeError(error),
        });
    }
});

// Get all documents
router.get('/', async (req, res) => {
    try {
        const { type, status, limit = '50' } = req.query;
        // console.log(`Fetching documents with params: type=${type}, status=${status}, limit=${limit}`);

        const parsedLimit = parseInt(limit as string);
        const validLimit = isNaN(parsedLimit) ? 50 : parsedLimit;

        const allDocuments = await db.listDocuments({
            type: type as string,
            status: status as string,
            limit: validLimit
        });

        // console.log(`Successfully fetched ${allDocuments.length} documents`);
        res.json(allDocuments);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            error: 'Failed to fetch documents',
            details: error instanceof Error ? error.message : JSON.stringify(error)
        });
    }
});

// Get document by ID
router.get('/:id', async (req, res) => {
    try {
        const document = await db.getDocument(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// Download document
router.get('/:id/download', async (req, res) => {
    try {
        const document = await db.getDocument(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Logic to resolve file path
        // Legacy paths might be just "documents/foo.pdf" or "pdfs/foo.pdf" used in Supabase bucket
        // New paths are "documents/filename"

        let fullPath = "";

        const resolvedFilepath = document.filepath || document.metadata?.filepath;

        if (resolvedFilepath?.startsWith('documents/')) {
            const fname = resolvedFilepath.split('documents/')[1];
            fullPath = path.join(documentsDir, fname);
        } else {
            // Fallback for legacy or other paths - might fail if not in local storage
            fullPath = path.join(documentsDir, document.filename);
        }

        if (!fs.existsSync(fullPath)) {
            // Last ditch effort: check by filename directly
            const altPath = path.join(documentsDir, document.filename);
            if (fs.existsSync(altPath)) {
                fullPath = altPath;
            } else {
                return res.status(404).json({ error: 'File not found on server' });
            }
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);

        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// Delete document
router.delete('/:id', async (req, res) => {
    try {
        const document = await db.getDocument(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from local filesystem
        const resolvedFilepath = document.filepath || document.metadata?.filepath;

        if (resolvedFilepath) {
            let fullPath = "";
            if (resolvedFilepath.startsWith('documents/')) {
                const fname = resolvedFilepath.split('documents/')[1];
                fullPath = path.join(documentsDir, fname);
            } else {
                fullPath = path.join(documentsDir, document.filename);
            }

            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (e) {
                    console.error('Failed to delete local file:', e);
                }
            }
        }

        // Delete from database
        await db.deleteDocument(req.params.id);

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export default router;
