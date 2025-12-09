import { Router } from 'express';
import { sendWhatsAppBill, sendWhatsAppText } from '../services/whatsapp.service';

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

        // Validate inputs - pdfUrl is now optional
        if (!customerName || !customerPhone) {
            return res.status(400).json({ error: 'Missing required fields (customerName, customerPhone)' });
        }

        // Generate a payment link
        const paymentLink = `https://myfabclean.com/pay/${orderId}`;

        // If no PDF URL, send text message instead
        if (!pdfUrl) {
            const message = `🧾 *FabZClean Invoice*\n\nHi ${customerName}!\n\nYour order *#${orderId}* for ₹${amount || '0.00'} has been confirmed.\n\n📋 View Bill: https://myfabclean.com/bill/${orderId}\n\nThank you for choosing FabZClean!`;

            await sendWhatsAppText({
                customerPhone,
                message
            });

            return res.json({ success: true, message: 'WhatsApp text message sent successfully' });
        }

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

// Fallback simple text message endpoint
router.post('/send-text', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'Missing required fields (phone, message)' });
        }

        await sendWhatsAppText({
            customerPhone: phone,
            message
        });

        res.json({ success: true, message: 'WhatsApp message sent successfully' });
    } catch (error) {
        console.error('WhatsApp text send error:', error);
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});

export default router;

