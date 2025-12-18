// server/routes/whatsapp.ts
import { Router } from "express";
import { sendInvoiceWhatsApp, sendTextWhatsApp } from "../services/whatsapp.service";

const router = Router();

/**
 * POST /api/whatsapp/send-invoice
 * Send invoice via WhatsApp with PDF attachment
 */
router.post("/send-invoice", async (req, res) => {
    try {
        const {
            phoneNumber,
            pdfUrl,
            filename,
            customerName,
            invoiceNumber,
            amount,
            itemName,
        } = req.body;

        // Basic validation
        if (!phoneNumber || !pdfUrl) {
            return res.status(400).json({ error: "Missing required fields (phoneNumber, pdfUrl)" });
        }

        const result = await sendInvoiceWhatsApp({
            phoneNumber,
            pdfUrl,
            filename: filename || `Invoice-${invoiceNumber || 'order'}.pdf`,
            customerName: customerName || "Valued Customer",
            invoiceNumber: invoiceNumber || "N/A",
            amount: String(amount || "0.00"),
            itemName: itemName || "Laundry Items",
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("WhatsApp Route Error:", error);
        res.status(500).json({ success: false, error: "Failed to send message" });
    }
});

/**
 * POST /api/whatsapp/send-bill (Legacy endpoint - redirects to send-invoice)
 * Kept for backward compatibility
 */
router.post("/send-bill", async (req, res) => {
    try {
        const {
            customerName,
            customerPhone,
            orderId,
            amount,
            mainItem,
            pdfUrl
        } = req.body;

        // Validate inputs
        if (!customerName || !customerPhone) {
            return res.status(400).json({ error: "Missing required fields (customerName, customerPhone)" });
        }

        // If no PDF URL, send text message instead (optimized message)
        if (!pdfUrl) {
            const itemText = mainItem ? `This includes your ${mainItem} and home delivery charges.` : "This includes home delivery charges.";
            const message = `Hi ${customerName}! 👋 Your laundry order is Processing! 🧺\n\nWe have generated Invoice ${orderId} for ₹${amount || '0.00'}. ${itemText}\n\nPayment Options: Scan the QR in the invoice or use UPI / Google Pay / PhonePe.\n📄 Terms: https://myfabclean.com/terms\n\nThanks for choosing Fab Clean!`;

            await sendTextWhatsApp({
                phoneNumber: customerPhone,
                message,
            });

            return res.json({ success: true, message: "WhatsApp text message sent successfully" });
        }

        // Send with PDF attachment
        const result = await sendInvoiceWhatsApp({
            phoneNumber: customerPhone,
            pdfUrl,
            filename: `Invoice-${orderId}.pdf`,
            customerName,
            invoiceNumber: orderId,
            amount: String(amount || "0.00"),
            itemName: mainItem || "Laundry Items",
        });

        res.json({ success: true, message: "WhatsApp bill sent successfully", data: result });
    } catch (error) {
        console.error("WhatsApp Bill Error:", error);
        res.status(500).json({ success: false, error: "Failed to send WhatsApp message" });
    }
});

/**
 * POST /api/whatsapp/send-text
 * Send plain text WhatsApp message
 */
router.post("/send-text", async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: "Missing required fields (phone, message)" });
        }

        await sendTextWhatsApp({
            phoneNumber: phone,
            message,
        });

        res.json({ success: true, message: "WhatsApp message sent successfully" });
    } catch (error) {
        console.error("WhatsApp text send error:", error);
        res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
});

export default router;
