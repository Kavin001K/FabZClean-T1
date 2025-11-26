import express, { Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';

const router = express.Router();

router.post('/send', async (req: Request, res: Response) => {
    try {
        const { order, pdfUrl } = req.body;

        if (!order) {
            return res.status(400).json({ error: 'Missing order data' });
        }

        if (!pdfUrl) {
            console.warn('⚠️ No PDF URL provided, sending text-only message');
        }

        console.log('📱 WhatsApp API called with:', {
            phone: order.customerPhone,
            orderNumber: order.orderNumber,
            hasPDF: !!pdfUrl
        });

        const success = await whatsappService.sendOrderConfirmation(order, pdfUrl);

        if (success) {
            res.json({ success: true, message: 'WhatsApp message sent successfully' });
        } else {
            res.status(500).json({
                error: 'Failed to send WhatsApp message',
                details: 'Check server logs for more information'
            });
        }
    } catch (error: any) {
        console.error('❌ WhatsApp route error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

export default router;
