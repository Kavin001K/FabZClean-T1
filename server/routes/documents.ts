import { Router } from 'express';
import multer from 'multer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
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

// Lazy-loaded Supabase client (only initialized when actually needed)
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
    if (_supabase) return _supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase not configured - document storage features disabled');
        return null;
    }

    _supabase = createClient(supabaseUrl, supabaseKey);
    return _supabase;
}

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return res.status(503).json({ error: 'Document storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.' });
        }

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

        const filename = req.file.originalname;
        const filepath = `documents/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`; // Sanitize filename

        // Ensure bucket exists
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            console.error('Error listing buckets:', bucketError);
        } else if (!buckets.find((b: { name: string }) => b.name === 'pdfs')) {
            const { error: createBucketError } = await supabase.storage.createBucket('pdfs', {
                public: true
            });
            if (createBucketError) {
                console.error('Error creating bucket:', createBucketError);
                return res.status(500).json({ error: 'Failed to configure storage bucket' });
            }
        }

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(filepath, req.file.buffer, {
                contentType: 'application/pdf',
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload file to storage', details: uploadError.message });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(filepath);

        const fileUrl = urlData.publicUrl;

        // Save document record to database
        try {
            const document = await db.createDocument({
                franchiseId: (req as any).user?.franchiseId, // Assuming user is attached to req
                type: type || 'invoice',
                title: (metadata as any).invoiceNumber ? `Invoice ${(metadata as any).invoiceNumber}` : filename,
                filename,
                filepath,
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
            await supabase.storage.from('pdfs').remove([filepath]);
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
        console.log(`Fetching documents with params: type=${type}, status=${status}, limit=${limit}`);

        const parsedLimit = parseInt(limit as string);
        const validLimit = isNaN(parsedLimit) ? 50 : parsedLimit;

        const allDocuments = await db.listDocuments({
            type: type as string,
            status: status as string,
            limit: validLimit
        });

        console.log(`Successfully fetched ${allDocuments.length} documents`);
        res.json(allDocuments);
    } catch (error) {
        console.error('Error fetching documents:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
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
        const supabase = getSupabase();
        if (!supabase) {
            return res.status(503).json({ error: 'Document storage not configured.' });
        }

        const document = await db.getDocument(req.params.id);

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
        const supabase = getSupabase();

        const document = await db.getDocument(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from Supabase Storage (only if supabase is configured)
        if (supabase) {
            const { error: deleteError } = await supabase.storage
                .from('pdfs')
                .remove([document.filepath]);

            if (deleteError) {
                console.error('Storage delete error:', deleteError);
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
