import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
// @ts-ignore
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure documents directory exists
const documentsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer for local disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, documentsDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename and add timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${uniqueSuffix}-${originalName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
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

        const filename = req.file.filename;
        const filepath = `documents/${filename}`; // Relative path
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/documents/${filename}`;

        // Save document record to database
        try {
            const document = await db.createDocument({
                franchiseId: (req as any).user?.franchiseId, // Assuming user is attached to req
                type: type || 'invoice',
                title: (metadata as any).invoiceNumber ? `Invoice ${(metadata as any).invoiceNumber}` : req.file.originalname,
                filename: req.file.originalname,
                filepath, // Store relative path or absolute? Storing relative is better.
                fileUrl,
                status: (metadata as any).status || 'sent',
                amount: (metadata as any).amount ? String((metadata as any).amount) : null,
                customerName: (metadata as any).customerName || null,
                orderNumber: (metadata as any).orderNumber || null,
                metadata: (metadata as any).metadata || {},
            });

            res.json({
                success: true,
                document,
                message: 'Document uploaded successfully',
            });
        } catch (dbError) {
            console.error('Database insert error:', dbError);
            // Try to clean up the uploaded file if DB insert fails
            const fullPath = path.join(documentsDir, filename);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
            return res.status(500).json({ error: 'Failed to save document record', details: dbError instanceof Error ? dbError.message : String(dbError) });
        }
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({
            error: 'Failed to upload document',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get all documents
router.get('/', async (req, res) => {
    try {
        const { type, status, limit = '50' } = req.query;
        //
const parsedLimit = parseInt(limit as string);
        const validLimit = isNaN(parsedLimit) ? 50 : parsedLimit;

        const allDocuments = await db.listDocuments({
            type: type as string,
            status: status as string,
            limit: validLimit
        });

        //
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

        if (document.filepath.startsWith('documents/')) {
            const fname = document.filepath.split('documents/')[1];
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
        if (document.filepath) {
            let fullPath = "";
            if (document.filepath.startsWith('documents/')) {
                const fname = document.filepath.split('documents/')[1];
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

// Verify document
router.patch('/:id/verify', async (req, res) => {
    try {
        const { status, reason } = req.body;
        const employeeId = (req as any).user?.id || 'system';

        const document = await db.verifyDocument(req.params.id, status, reason, employeeId);
        if (!document) return res.status(404).json({ error: 'Document not found' });

        res.json({ success: true, document });
    } catch (error) {
        console.error('Error verifying document:', error);
        res.status(500).json({ error: 'Failed to verify document' });
    }
});

// Request update (Mock or simple log)
router.post('/:id/request-update', async (req, res) => {
    try {
        const document = await db.getDocument(req.params.id);
        if (!document) return res.status(404).json({ error: 'Document not found' });

        // In a real app, this would send an email/notification
        res.json({ success: true, message: 'Update request sent to franchise owner.' });
    } catch (error) {
        console.error('Error requesting update:', error);
        res.status(500).json({ error: 'Failed to request update' });
    }
});

export default router;
