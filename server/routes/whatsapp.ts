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
            mainItem,
            pdfUrl
        } = req.body;

        // Validate inputs - pdfUrl is now optional
        if (!customerName || !customerPhone) {
            return res.status(400).json({ error: 'Missing required fields (customerName, customerPhone)' });
        }

        // If no PDF URL, send text message instead (using the optimized text)
        if (!pdfUrl) {
            const itemText = mainItem ? `This includes your ${mainItem} and home delivery charges.` : 'This includes home delivery charges.';
            const message = `Hi ${customerName}! 👋 Your laundry order is Processing! 🧺\n\nWe have generated Invoice ${orderId} for ₹${amount || '0.00'}. ${itemText}\n\nPayment Options: Scan the QR in the invoice or use UPI / Google Pay / PhonePe.\n📄 Terms: https://myfabclean.com/terms\n\nThanks for choosing Fab Clean!`;

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
            mainItem: mainItem || "Laundry Items",
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

