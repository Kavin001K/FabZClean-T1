import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthService } from '../auth-service';
import { jwtRequired } from '../middleware/auth';
import { LocalStorage } from '../services/local-storage';

const router = express.Router();

// Configure multer with memory storage for processing
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
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
router.post('/upload-pdf', jwtRequired, upload.single('pdf'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // Extract order ID from filename or generate one
        const orderId = req.body.orderId || `temp-${Date.now()}`;

        // Save using LocalStorage service
        const publicUrl = await LocalStorage.saveInvoicePdf(orderId, req.file.buffer);

        console.log('✅ PDF saved:', publicUrl);

        // LOGGING: Log PDF upload (typically invoice generation)
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_invoice_pdf',
                'document',
                orderId,
                {
                    path: publicUrl,
                    sizeBytes: req.file.size,
                    sizeKB: Math.round(req.file.size / 1024)
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            url: publicUrl,
            orderId: orderId,
            size: req.file.size
        });
    } catch (error: any) {
        console.error('PDF upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload PDF' });
    }
});

/**
 * POST /api/pdf/generate-invoice/:orderId
 * Generate and save an invoice PDF
 */
router.post('/generate-invoice/:orderId', jwtRequired, async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { pdfBuffer } = req.body;

        if (!pdfBuffer) {
            return res.status(400).json({ error: 'PDF buffer is required' });
        }

        // Convert base64 to buffer if needed
        const buffer = Buffer.isBuffer(pdfBuffer)
            ? pdfBuffer
            : Buffer.from(pdfBuffer, 'base64');

        // Save using LocalStorage service
        const publicUrl = await LocalStorage.saveInvoicePdf(orderId, buffer);

        console.log(`✅ Invoice PDF generated for order ${orderId}: ${publicUrl}`);

        // Log the action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_invoice_pdf',
                'invoice',
                orderId,
                { path: publicUrl, sizeBytes: buffer.length },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            url: publicUrl,
            orderId: orderId
        });
    } catch (error: any) {
        console.error('Invoice PDF generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate invoice PDF' });
    }
});

/**
 * POST /api/pdf/save-report
 * Save a generated report document
 */
router.post('/save-report', jwtRequired, async (req: Request, res: Response) => {
    try {
        const { reportName, pdfBuffer, extension } = req.body;

        if (!reportName || !pdfBuffer) {
            return res.status(400).json({ error: 'Report name and PDF buffer are required' });
        }

        const buffer = Buffer.isBuffer(pdfBuffer)
            ? pdfBuffer
            : Buffer.from(pdfBuffer, 'base64');

        const publicUrl = await LocalStorage.saveReport(reportName, buffer, extension || '.pdf');

        console.log(`✅ Report saved: ${publicUrl}`);

        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_report',
                'report',
                reportName,
                { path: publicUrl, sizeBytes: buffer.length },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            url: publicUrl,
            reportName: reportName
        });
    } catch (error: any) {
        console.error('Report save error:', error);
        res.status(500).json({ error: error.message || 'Failed to save report' });
    }
});

/**
 * DELETE /api/pdf/file
 * Delete a file from storage
 */
router.delete('/file', jwtRequired, async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        const deleted = await LocalStorage.deleteFile(url);

        if (deleted) {
            res.json({ success: true, message: 'File deleted' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error: any) {
        console.error('File delete error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete file' });
    }
});

/**
 * GET /api/pdf/check/:orderId
 * Check if an invoice PDF exists for an order
 */
router.get('/check/:orderId', async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        // Check current month first, then previous months
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const possibleUrl = `/uploads/documents/invoices/${year}/${month}/invoice-${orderId}.pdf`;
        const exists = LocalStorage.fileExists(possibleUrl);

        res.json({
            exists,
            url: exists ? possibleUrl : null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
