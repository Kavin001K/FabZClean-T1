// server/routes/whatsapp.ts
import { Router } from "express";
import {
    sendInvoiceWhatsApp,
    sendTextWhatsApp,
    getTemplateForSendCount,
    MAX_RESENDS,
} from "../services/whatsapp.service";
import { smartItemSummary } from "../utils/item-summarizer";

const router = Router();

/**
 * POST /api/whatsapp/send-invoice
 * Send invoice via WhatsApp with PDF attachment
 * Supports template cycling based on sendCount
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
            sendCount = 0,
        } = req.body;

        // Basic validation
        if (!phoneNumber || !pdfUrl) {
            return res.status(400).json({ error: "Missing required fields (phoneNumber, pdfUrl)" });
        }

        // Check max resends
        if (sendCount >= MAX_RESENDS) {
            return res.status(400).json({
                success: false,
                error: `Maximum messages (${MAX_RESENDS}) already sent for this order`,
                canResendAgain: false,
            });
        }

        // Get template based on send count
        const templateType = getTemplateForSendCount(sendCount);
const result = await sendInvoiceWhatsApp({
            phoneNumber,
            pdfUrl,
            filename: filename || `Invoice-${invoiceNumber || 'order'}.pdf`,
            customerName: customerName || "Valued Customer",
            invoiceNumber: invoiceNumber || "N/A",
            amount: String(amount || "0.00"),
            itemName: itemName || "Laundry Items",
            templateType,
        });

        const newSendCount = sendCount + 1;

        res.json({
            success: result.success,
            error: result.error,
            templateUsed: result.templateUsed,
            newSendCount,
            canResendAgain: newSendCount < MAX_RESENDS,
            remainingSends: MAX_RESENDS - newSendCount,
        });
    } catch (error) {
        console.error("[WhatsApp] Route Error:", error);
        res.status(500).json({ success: false, error: "Failed to send message" });
    }
});

/**
 * POST /api/whatsapp/send-bill
 * Send bill notification via WhatsApp
 * Supports template cycling based on sendCount
 */
router.post("/send-bill", async (req, res) => {
    try {
        const {
            customerName,
            customerPhone,
            orderId,
            amount,
            mainItem,
            items,
            pdfUrl,
            sendCount = 0,
        } = req.body;

        // Validate inputs
        if (!customerName || !customerPhone) {
            return res.status(400).json({ error: "Missing required fields (customerName, customerPhone)" });
        }

        // Check max resends
        if (sendCount >= MAX_RESENDS) {
            return res.status(400).json({
                success: false,
                error: `Maximum messages (${MAX_RESENDS}) already sent for this order`,
                canResendAgain: false,
                newSendCount: sendCount,
            });
        }

        // Smart Item Summary
        const itemSummary = mainItem || smartItemSummary(items) || "Laundry Items";
// Get template based on send count
        const templateType = getTemplateForSendCount(sendCount);
// If no PDF URL, send text message instead
        if (!pdfUrl) {
            const itemText = itemSummary !== "Laundry Items"
                ? `This includes your ${itemSummary}.`
                : "";

            const appBaseUrl = process.env.APP_BASE_URL || 'https://acedigital.myfabclean.com';
            const message = `Hi ${customerName}! 👋 Your laundry order is Processing! 🧺\n\nWe have generated Invoice ${orderId} for ₹${amount || '0.00'}.${itemText ? ` ${itemText}` : ''}\n\nPayment Options: Scan the QR in the invoice or use UPI / Google Pay / PhonePe.\n📄 Terms: ${appBaseUrl}/terms\n\nThanks for choosing Fab Clean!`;

            const textResult = await sendTextWhatsApp({
                phoneNumber: customerPhone,
                message,
            });

            const newSendCount = sendCount + 1;

            return res.json({
                success: textResult.success,
                error: textResult.error,
                message: "WhatsApp text message sent",
                newSendCount,
                canResendAgain: newSendCount < MAX_RESENDS,
            });
        }

        // Send with PDF attachment using appropriate template
        const result = await sendInvoiceWhatsApp({
            phoneNumber: customerPhone,
            pdfUrl,
            filename: `Invoice-${orderId}.pdf`,
            customerName,
            invoiceNumber: orderId,
            amount: String(amount || "0.00"),
            itemName: itemSummary,
            templateType,
        });

        const newSendCount = sendCount + 1;

        res.json({
            success: result.success,
            error: result.error,
            message: "WhatsApp bill sent successfully",
            templateUsed: result.templateUsed,
            newSendCount,
            canResendAgain: newSendCount < MAX_RESENDS,
            remainingSends: MAX_RESENDS - newSendCount,
        });
    } catch (error) {
        console.error("[WhatsApp] Bill Error:", error);
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

        const result = await sendTextWhatsApp({
            phoneNumber: phone,
            message,
        });

        res.json({
            success: result.success,
            error: result.error,
            message: result.success ? "WhatsApp message sent successfully" : "Failed to send",
        });
    } catch (error) {
        console.error("[WhatsApp] Text send error:", error);
        res.status(500).json({ success: false, error: "Failed to send WhatsApp message" });
    }
});

export default router;
