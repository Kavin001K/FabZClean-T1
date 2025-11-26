import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db';
import { documents } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { type, metadata: metadataStr } = req.body;
        const metadata = metadataStr ? JSON.parse(metadataStr) : {};

        const filename = req.file.originalname;
        const filepath = `documents/${Date.now()}-${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(filepath, req.file.buffer, {
                contentType: 'application/pdf',
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload file to storage' });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(filepath);

        const fileUrl = urlData.publicUrl;

        // Save document record to database
        const [document] = await db.insert(documents).values({
            type: type || 'invoice',
            title: metadata.invoiceNumber ? `Invoice ${metadata.invoiceNumber}` : filename,
            filename,
            filepath,
            fileUrl,
            status: metadata.status || 'sent',
            amount: metadata.amount ? String(metadata.amount) : null,
            customerName: metadata.customerName || null,
            orderNumber: metadata.orderNumber || null,
            metadata: metadata.metadata || {},
        }).returning();

        res.json({
            success: true,
            document,
            message: 'Document uploaded successfully',
        });
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

        let query = db.select().from(documents);

        if (type) {
            query = query.where(eq(documents.type, type as string));
        }

        if (status) {
            query = query.where(eq(documents.status, status as string));
        }

        const allDocuments = await query
            .orderBy(documents.createdAt)
            .limit(parseInt(limit as string));

        res.json(allDocuments);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Get document by ID
router.get('/:id', async (req, res) => {
    try {
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, req.params.id));

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
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, req.params.id));

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Get file from Supabase
        const { data, error } = await supabase.storage
            .from('pdfs')
            .download(document.filepath);

        if (error) {
            console.error('Download error:', error);
            return res.status(500).json({ error: 'Failed to download file' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);

        const buffer = Buffer.from(await data.arrayBuffer());
        res.send(buffer);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// Delete document
router.delete('/:id', async (req, res) => {
    try {
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, req.params.id));

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
            .from('pdfs')
            .remove([document.filepath]);

        if (deleteError) {
            console.error('Storage delete error:', deleteError);
        }

        // Delete from database
        await db.delete(documents).where(eq(documents.id, req.params.id));

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export default router;
