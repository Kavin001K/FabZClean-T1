import express, { Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';

const router = express.Router();

router.post('/send', async (req: Request, res: Response) => {
    try {
        const { order, pdfUrl } = req.body;

        if (!order || !pdfUrl) {
            return res.status(400).json({ error: 'Missing order or pdfUrl' });
        }

        const success = await whatsappService.sendOrderConfirmation(order, pdfUrl);

        if (success) {
            res.json({ success: true, message: 'WhatsApp message sent' });
        } else {
            res.status(500).json({ error: 'Failed to send WhatsApp message' });
        }
    } catch (error: any) {
        console.error('WhatsApp route error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
