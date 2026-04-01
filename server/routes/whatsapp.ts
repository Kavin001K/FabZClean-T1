
// server/routes/whatsapp.ts
import { Router } from "express";
import {
    sendInvoiceWhatsApp,
    sendTextWhatsApp,
    getTemplateForSendCount,
    MAX_RESENDS,
} from "../services/whatsapp.service";
import { ensureOrderInvoiceDocument } from "../services/order-invoice.service";
import { smartItemSummary } from "../utils/item-summarizer";
import { storage } from "../storage";

const router = Router();
const INVOICE_PUBLIC_BASE_URL = (process.env.R2_INVOICE_PUBLIC_BASE_URL || 'https://bill.myfabclean.com').replace(/\/$/, '');

const resolveInvoicePublicUrl = (doc: any): string | null => {
    const rawUrl = doc?.fileUrl || doc?.file_url;
    const filepath = doc?.filepath || doc?.file_path || doc?.metadata?.filepath;

    if (rawUrl && typeof rawUrl === 'string') {
        if (INVOICE_PUBLIC_BASE_URL && rawUrl.includes('.r2.cloudflarestorage.com/')) {
            const split = rawUrl.split('.r2.cloudflarestorage.com/');
            const objectPath = split[1] || '';
            const normalizedPath = objectPath.replace(/^invoice-pdf\//, '');
            return `${INVOICE_PUBLIC_BASE_URL}/${normalizedPath}`;
        }
        return rawUrl;
    }

    if (filepath && typeof filepath === 'string') {
        const normalizedPath = filepath.replace(/^invoice-pdf\//, '');
        return `${INVOICE_PUBLIC_BASE_URL}/${normalizedPath}`;
    }

    return null;
};

/**
 * POST /api/whatsapp/send-invoice
 * Send invoice via WhatsApp with PDF attachment
 * Uses the configured MSG91 invoice template and resend count guard.
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
            filename,
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

        let resolvedPdfUrl = pdfUrl;
        let matchedOrder: any | undefined;

        const allOrders = await storage.listOrders();
        matchedOrder = allOrders.find((order: any) =>
            String(order.orderNumber || '') === String(orderId || '')
        );

        if (!resolvedPdfUrl) {
            try {
                const documents = await (storage as any).listDocuments({
                    type: 'invoice',
                    limit: 200
                });

                const matchedDoc = documents.find((doc: any) =>
                    (doc.orderNumber === orderId || doc.order_number === orderId) ||
                    (doc.metadata && (doc.metadata.orderNumber === orderId || doc.metadata.orderId === orderId)) ||
                    (filename && doc.filename === filename)
                );

                if (matchedDoc) {
                    resolvedPdfUrl = resolveInvoicePublicUrl(matchedDoc) || undefined;
                    console.log(`[WhatsApp] Found invoice URL from DB: ${resolvedPdfUrl}`);
                }
            } catch (docError) {
                console.warn('[WhatsApp] Could not lookup invoice document:', docError);
            }
        }

        if (!resolvedPdfUrl && matchedOrder) {
            try {
                const invoiceResult = await ensureOrderInvoiceDocument(matchedOrder);
                resolvedPdfUrl = invoiceResult.fileUrl;
                console.log(`[WhatsApp] Generated invoice on demand for ${orderId}: ${resolvedPdfUrl}`);
            } catch (invoiceError) {
                console.error(`[WhatsApp] Failed to generate invoice for ${orderId}:`, invoiceError);
            }
        }

        if (!resolvedPdfUrl) {
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
            pdfUrl: resolvedPdfUrl,
            filename: filename || `Invoice-${orderId}.pdf`,
            customerName,
            invoiceNumber: orderId,
            amount: String(amount || "0.00"),
            itemName: itemSummary,
            templateType,
        });

        const newSendCount = sendCount + 1;

        // Sync PDF URL and WhatsApp status back to the order table
        try {
            if (matchedOrder && result.success) {
                await storage.updateOrder(matchedOrder.id, {
                    invoiceUrl: resolvedPdfUrl,
                    lastWhatsappStatus: `Order Confirmation Sent - Count: ${newSendCount}`,
                    lastWhatsappSentAt: new Date(),
                    whatsappMessageCount: newSendCount,
                });
            } else if (matchedOrder && !result.success) {
                await storage.updateOrder(matchedOrder.id, {
                    lastWhatsappStatus: `Order Confirmation Failed: ${result.error}`,
                });
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
