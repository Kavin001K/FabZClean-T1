
// server/routes/whatsapp.ts
import { Router } from "express";
import {
    sendInvoiceWhatsApp,
    sendTextWhatsApp,
    getTemplateForSendCount,
    MAX_RESENDS,
} from "../services/whatsapp.service";
import { smartItemSummary } from "../utils/item-summarizer";
import { storage } from "../storage";

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
                error: `Maximum messages(${ MAX_RESENDS }) already sent for this order`,
                canResendAgain: false,
            });
        }

        // Get template based on send count
        const templateType = getTemplateForSendCount(sendCount);

        console.log(`[WhatsApp] Send #${ sendCount + 1 } using template: ${ templateType }`);

        const result = await sendInvoiceWhatsApp({
            phoneNumber,
            pdfUrl,
            filename: filename || `Invoice - ${ invoiceNumber || 'order' }.pdf`,
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
 * Send order confirmation via WhatsApp
 * Uses the new order template and resend count tracking
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
                error: `Maximum messages(${ MAX_RESENDS }) already sent for this order`,
                canResendAgain: false,
                newSendCount: sendCount,
            });
        }

        // Smart Item Summary
        const itemSummary = mainItem || smartItemSummary(items) || "Laundry Items";
        console.log(`[WhatsApp] Order confirmation for ${ orderId }, sendCount: ${ sendCount }, item: "${itemSummary}"`);

        // Get template based on send count
        const templateType = getTemplateForSendCount(sendCount);
        console.log(`[WhatsApp] Using template: ${ templateType } `);

        if (!pdfUrl) {
            return res.status(400).json({
                success: false,
                error: "PDF URL is required to send the WhatsApp confirmation.",
                canResendAgain: false,
                newSendCount: sendCount,
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

// Sync real pdfUrl and WhatsApp status back to the order table
try {
    if (result.success && pdfUrl) {
        // Find order internal ID via the orderNumber
        const allOrders = await storage.listOrders();
        const matchedOrder = allOrders.find(o => o.orderNumber === orderId);

        if (matchedOrder) {
                await storage.updateOrder(matchedOrder.id, {
                    invoiceUrl: pdfUrl,
                    lastWhatsappStatus: `Order Confirmation Sent - Count: ${newSendCount}`,
                    lastWhatsappSentAt: new Date(),
                    whatsappMessageCount: newSendCount,
                });
        }
    } else if (!result.success && pdfUrl) {
        const allOrders = await storage.listOrders();
        const matchedOrder = allOrders.find(o => o.orderNumber === orderId);

        if (matchedOrder) {
                await storage.updateOrder(matchedOrder.id, {
                    lastWhatsappStatus: `Order Confirmation Failed: ${result.error}`,
                });
        }
    }
} catch (dbErr) {
    console.warn("[WhatsApp] Failed to update DB tracking post bill send:", dbErr);
}

res.json({
    success: result.success,
    error: result.error,
    message: "WhatsApp order confirmation sent successfully",
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
