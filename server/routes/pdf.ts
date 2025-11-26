import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Create uploads directory if it doesn't exist
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

import { createClient } from '@supabase/supabase-js';

// Configure storage based on environment
const useSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;

// Multer configuration
const storage = useSupabase
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'bill-' + uniqueSuffix + '.pdf');
        }
    });

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

/**
 * POST /api/upload-pdf
 * Upload a PDF file and return public URL
 */
router.post('/upload-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        let publicUrl: string;
        let filename: string;

        if (useSupabase) {
            // Upload to Supabase Storage
            const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
            filename = `bill-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;

            const { data, error } = await supabase
                .storage
                .from('pdfs')
                .upload(filename, req.file.buffer!, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl: url } } = supabase
                .storage
                .from('pdfs')
                .getPublicUrl(filename);

            publicUrl = url;
            console.log('✅ PDF uploaded to Supabase:', publicUrl);
        } else {
            // Local storage
            filename = req.file.filename;
            const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
            publicUrl = `${baseUrl}/uploads/pdfs/${filename}`;
            console.log('✅ PDF uploaded locally:', publicUrl);

            // Schedule deletion after 24 hours
            setTimeout(() => {
                const filePath = path.join(uploadsDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Deleted temporary PDF:', filename);
                }
            }, 24 * 60 * 60 * 1000);
        }

        res.json({
            success: true,
            url: publicUrl,
            filename: filename,
            size: req.file.size
        });
    } catch (error: any) {
        console.error('PDF upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload PDF' });
    }
});

/**
 * GET /uploads/pdfs/:filename
 * Serve uploaded PDF files
 */
router.get('/uploads/pdfs/:filename', (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        // Security: prevent directory traversal
        if (!filePath.startsWith(uploadsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Set headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error: any) {
        console.error('PDF serve error:', error);
        res.status(500).json({ error: error.message || 'Failed to serve PDF' });
    }
});

/**
 * DELETE /api/pdf/:filename
 * Delete a PDF file (for cleanup)
 */
router.delete('/pdf/:filename', (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        // Security check
        if (!filePath.startsWith(uploadsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'PDF deleted' });
        } else {
            res.status(404).json({ error: 'PDF not found' });
        }
    } catch (error: any) {
        console.error('PDF delete error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete PDF' });
    }
});

export default router;
