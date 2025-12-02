import { Router } from 'express';
import { sendWhatsAppBill } from '../services/whatsapp.service';

const router = Router();

router.post('/send-bill', async (req, res) => {
    try {
        const {
            customerName,
            customerPhone,
            orderId,
            amount,
            pdfUrl
        } = req.body;

        // Validate inputs
        if (!customerName || !customerPhone || !pdfUrl) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate a payment link (Mock logic - replace with actual if you have one)
        const paymentLink = `https://fabclean.com/pay/${orderId}`;

        await sendWhatsAppBill({
            customerName,
            customerPhone,
            orderId,
            amount: amount || "0.00",
            paymentLink,
            pdfUrl
        });

        res.json({ success: true, message: 'WhatsApp bill sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});

export default router;
