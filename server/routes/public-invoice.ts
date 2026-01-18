import { Router, Request, Response } from "express";
import { db as storage } from "../db";

const router = Router();

/**
 * Public Invoice Generation API
 * Generates a printable HTML invoice for an order
 */

// Generate invoice HTML for an order (public endpoint)
router.get('/invoice/:orderNumber', async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;
        const { download } = req.query; // ?download=true to trigger download

        if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
        }

        console.log(`[Invoice] Generating invoice for order: ${orderNumber}`);

        // Find the order
        const orders = await storage.listOrders();
        const searchTerm = orderNumber.trim().replace(/^#/, '').toLowerCase();

        const order = orders.find((o: any) => {
            const storedOrderNum = (o.orderNumber || o.order_number || '').toString().trim().replace(/^#/, '').toLowerCase();
            const storedId = (o.id || '').toLowerCase();
            return storedOrderNum === searchTerm || storedId === searchTerm ||
                storedOrderNum.includes(searchTerm) || searchTerm.includes(storedOrderNum);
        }) as any;

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Extract order data
        const orderData = {
            orderNumber: order.orderNumber || order.order_number,
            customerName: order.customerName || order.customer_name || 'Customer',
            customerPhone: order.customerPhone || order.customer_phone || '',
            customerAddress: order.customerAddress || order.customer_address || '',
            createdAt: order.createdAt || order.created_at,
            items: (order.items || []).map((item: any) => ({
                description: item.serviceName || item.service_name || item.name || item.productName || 'Service',
                quantity: item.quantity || 1,
                unitPrice: parseFloat(item.price || item.unitPrice || item.unit_price || 0),
                total: parseFloat(item.price || item.unitPrice || item.unit_price || 0) * (item.quantity || 1),
            })),
            subtotal: parseFloat(order.subtotal || order.totalAmount || order.total_amount || 0),
            deliveryCharges: parseFloat(order.deliveryCharges || order.delivery_charges || 0),
            total: parseFloat(order.totalAmount || order.total_amount || 0),
            paymentStatus: order.paymentStatus || order.payment_status || 'pending',
            fulfillmentType: order.fulfillmentType || order.fulfillment_type || 'pickup',
            isExpressOrder: order.isExpressOrder || order.is_express_order || false,
        };

        // Calculate totals if not available
        if (!orderData.subtotal || orderData.subtotal === 0) {
            orderData.subtotal = orderData.items.reduce((sum: number, item: any) => sum + item.total, 0);
        }
        if (!orderData.total || orderData.total === 0) {
            orderData.total = orderData.subtotal + orderData.deliveryCharges;
        }

        // Format date
        const invoiceDate = new Date(orderData.createdAt || new Date()).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Format currency
        const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Generate HTML invoice
        const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${orderData.orderNumber} | Fab Clean</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #1a1a1a;
            background: #f5f5f5;
        }
        .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-radius: 12px;
        }
        @media print {
            body { background: white; }
            .invoice-container { 
                margin: 0; 
                box-shadow: none; 
                border-radius: 0;
                max-width: 100%;
            }
            .no-print { display: none !important; }
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .company-info h1 {
            font-size: 28px;
            color: #065f46;
            margin-bottom: 8px;
        }
        .company-info p {
            color: #6b7280;
            font-size: 13px;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h2 {
            font-size: 36px;
            color: #10b981;
            margin-bottom: 8px;
        }
        .invoice-title .invoice-number {
            font-weight: bold;
            font-size: 16px;
        }
        .invoice-title .invoice-date {
            color: #6b7280;
            font-size: 13px;
        }
        .bill-to {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .bill-to h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #065f46;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .bill-to .name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .bill-to .contact {
            color: #4b5563;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background: #f9fafb;
            padding: 14px;
            text-align: left;
            font-weight: 600;
            color: #065f46;
            border-bottom: 2px solid #10b981;
        }
        th:last-child, td:last-child { text-align: right; }
        th:nth-child(2), td:nth-child(2) { text-align: center; }
        th:nth-child(3), td:nth-child(3) { text-align: right; }
        td {
            padding: 14px;
            border-bottom: 1px solid #e5e7eb;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
        }
        .totals-box {
            width: 280px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        .total-row.grand-total {
            font-size: 20px;
            font-weight: bold;
            color: #065f46;
            border-top: 2px solid #10b981;
            padding-top: 12px;
            margin-top: 8px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
        }
        .footer .thanks {
            font-size: 16px;
            color: #065f46;
            margin-bottom: 8px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .download-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
        }
        @media (max-width: 600px) {
            .invoice-container { 
                margin: 10px; 
                padding: 20px; 
            }
            .header { 
                flex-direction: column; 
                gap: 20px; 
            }
            .invoice-title { 
                text-align: left; 
            }
            table { font-size: 12px; }
            th, td { padding: 10px 8px; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>🧺 Fab Clean</h1>
                <p>#16, Venkatramana Round Road,<br>Opp to HDFC Bank, Mahalingapuram,<br>Pollachi - 642002</p>
                <p>📞 +91 93630 59595</p>
                <p>✉️ support@myfabclean.com</p>
            </div>
            <div class="invoice-title">
                <h2>INVOICE</h2>
                <p class="invoice-number">#${orderData.orderNumber}</p>
                <p class="invoice-date">Date: ${invoiceDate}</p>
                <p style="margin-top: 10px;">
                    <span class="status-badge ${orderData.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
                        ${orderData.paymentStatus === 'paid' ? '✓ PAID' : 'PENDING'}
                    </span>
                </p>
            </div>
        </div>

        <!-- Bill To -->
        <div class="bill-to">
            <h3>Bill To</h3>
            <p class="name">${orderData.customerName}</p>
            ${orderData.customerPhone ? `<p class="contact">📞 ${orderData.customerPhone}</p>` : ''}
            ${orderData.customerAddress ? `<p class="contact">📍 ${orderData.customerAddress}</p>` : ''}
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${orderData.items.length > 0 ? orderData.items.map((item: any) => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td><strong>${formatCurrency(item.total)}</strong></td>
                    </tr>
                `).join('') : `
                    <tr>
                        <td colspan="4" style="text-align: center; color: #9ca3af;">No items</td>
                    </tr>
                `}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-box">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(orderData.subtotal)}</span>
                </div>
                ${orderData.deliveryCharges > 0 ? `
                    <div class="total-row">
                        <span>Delivery Charges</span>
                        <span>${formatCurrency(orderData.deliveryCharges)}</span>
                    </div>
                ` : ''}
                <div class="total-row grand-total">
                    <span>Total</span>
                    <span>${formatCurrency(orderData.total)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="thanks">Thank you for choosing Fab Clean! 💚</p>
            <p>For queries, contact us at +91 93630 59595 or support@myfabclean.com</p>
            <p style="margin-top: 10px;">This is a computer-generated invoice.</p>
        </div>
    </div>

    <!-- Download/Print Button -->
    <button class="download-btn no-print" onclick="window.print()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download / Print
    </button>

    <script>
        // Auto-trigger print if download parameter is set
        ${download === 'true' ? 'window.onload = function() { setTimeout(function() { window.print(); }, 500); };' : ''}
    </script>
</body>
</html>
        `;

        // Set content headers
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        if (download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="Invoice-${orderData.orderNumber}.html"`);
        }

        res.send(invoiceHtml);
    } catch (error) {
        console.error('[Invoice] Error generating invoice:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
});

export default router;
