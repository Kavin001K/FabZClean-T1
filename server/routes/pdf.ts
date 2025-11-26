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

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
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
        // Accept PDFs only
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
router.post('/upload-pdf', upload.single('pdf'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // Generate public URL
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const publicUrl = `${baseUrl}/uploads/pdfs/${req.file.filename}`;

        console.log('✅ PDF uploaded:', publicUrl);

        // Schedule deletion after 24 hours
        setTimeout(() => {
            const filePath = path.join(uploadsDir, req.file!.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ Deleted temporary PDF:', req.file!.filename);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours

        res.json({
            success: true,
            url: publicUrl,
            filename: req.file.filename,
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
