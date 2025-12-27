# MSG91 WhatsApp Notification Integration

## Overview

This document describes the automatic WhatsApp notification system integrated with FabZClean orders using MSG91's WhatsApp API.

## Configuration

Add the following environment variables to your `.env` file:

```bash
# MSG91 WhatsApp Integration
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_INTEGRATED_NUMBER=15558125705

# MSG91 Template Configuration
MSG91_NAMESPACE=1520cd50_8420_404b_b634_4808f5f33034
MSG91_TEMPLATE_NAME=v

MSG91_NAMESPACE_Bill=1520cd50_8420_404b_b634_4808f5f33034
MSG91_TEMPLATE_NAME_Bill=bill

MSG91_NAMESPACE_Invoice=1520cd50_8420_404b_b634_4808f5f33034
MSG91_TEMPLATE_NAME_Invoice=invoice_fabzclean
```

## Templates Used

### 1. Order Created Template (`v`)
**Trigger:** Automatically when a new order is created  
**Parameters:**
- `{{1}}` = Amount (e.g., "Rs.123")

**Use Case:** Notify customer about their new order with the total amount.

---

### 2. Order Processing Template (`bill`)
**Trigger:** Automatically when order status changes to `processing`  

**Components:**
- **Header:** Processing status image (set via `WHATSAPP_PROCESSING_IMAGE_URL`)
- **Body:**
  - `{{1}}` = Customer Name
  - `{{2}}` = Order Number
- **Buttons:**
  - "Track Order" → Link: `https://fabclean.com/track/{{1}}` (where {{1}} = Order Number)
  - "Terms of Service" → Link: `https://fabclean.com/terms`

**Template Text:**
```
[Header Image: Processing status graphic]

Hi {{Name}}! 👋 Great news! Your Order #{{Order ID}} is now In Process at Fab Clean. 🧺 
Our team is working their magic to make your items fresh and clean again. ✨ 
We will update you as soon as they are ready!

Fab Clean Team

[Track Order Button] → https://fabclean.com/track/{OrderNumber}
[Terms of Service Button] → https://fabclean.com/terms
```

**How the Track Button Works:**
- Template base URL: `https://fabclean.com/track/`
- Dynamic variable: Order Number is appended
- Result: `https://fabclean.com/track/FZC-2025POL9926A`


---

### 3. Status Update Template (`invoice_fabzclean`)
**Trigger:** Automatically when order status changes to:
- `ready_for_pickup` → Status = "Ready to Pickup"
- `out_for_delivery` → Status = "Out For Delivery"
- `completed` → Based on `fulfillmentType`:
  - If `pickup` → "Ready to Pickup"
  - If `delivery` → "Out For Delivery"

**Parameters:**
- `{{1}}` = Customer Name
- `{{2}}` = Order Number
- `{{3}}` = Status ("Ready to Pickup" or "Out For Delivery")
- `{{4}}` = Additional Info (e.g., "Your items are ready! Please visit us to collect your order. 🙏")

**Template Text:**
```
👋 Dear {{1}},

Update for Order #{{2}}: Status: {{3}} ✅

{{4}}

Thank you for choosing Fab Clean! 🧺
```

## Automatic Triggers

The system automatically sends WhatsApp notifications on these events:

| Event | Template | Status |
|-------|----------|--------|
| Order Created | `v` | Any new order |
| Status → Processing | `bill` | `processing` |
| Status → Ready for Pickup | `invoice_fabzclean` | `ready_for_pickup` |
| Status → Out for Delivery | `invoice_fabzclean` | `out_for_delivery` |
| Status → Completed | `invoice_fabzclean` | `completed` (uses fulfillmentType) |

## Fulfillment Type Logic

The order's `fulfillmentType` field determines the status message:

| Fulfillment Type | Final Status Message |
|------------------|---------------------|
| `pickup` | "Ready to Pickup" |
| `delivery` | "Out For Delivery" |

## API Functions

### `sendOrderCreatedNotification`
Sends the amount notification when an order is created.

```typescript
sendOrderCreatedNotification({
  phoneNumber: '9876543210',
  customerName: 'John Doe',
  orderNumber: 'ORD-001',
  amount: 'Rs.1234',
});
```

### `sendOrderProcessingNotification`
Sends processing notification when order is being processed.

```typescript
sendOrderProcessingNotification({
  phoneNumber: '9876543210',
  customerName: 'John Doe',
  orderNumber: 'ORD-001',
});
```

### `sendOrderStatusUpdateNotification`
Sends status update for pickup/delivery.

```typescript
sendOrderStatusUpdateNotification({
  phoneNumber: '9876543210',
  customerName: 'John Doe',
  orderNumber: 'ORD-001',
  status: 'Ready to Pickup',
  additionalInfo: 'Your items are ready!',
});
```

### `handleOrderStatusChange`
Main function that determines which notification to send based on status change.

```typescript
handleOrderStatusChange(
  {
    customerPhone: '9876543210',
    customerName: 'John Doe',
    orderNumber: 'ORD-001',
    totalAmount: '1234.00',
    status: 'processing',
    fulfillmentType: 'pickup',
  },
  'pending' // previous status
);
```

## Non-Blocking Execution

All WhatsApp notifications are sent asynchronously (fire-and-forget) to ensure:
- API responses are not delayed
- Order operations are not blocked by messaging failures
- Errors are logged but don't affect order processing

## Error Handling

- If `MSG91_AUTH_KEY` is not configured, notifications are skipped with a log message
- If customer phone is not available, notifications are skipped
- All errors are caught and logged without affecting the main order flow

## Logs

Look for these log patterns to debug WhatsApp integration:

```
📱 [WhatsApp] Sending Order Created to 919876543210
📄 [WhatsApp] Template: v (order)
💰 [WhatsApp] Order: ORD-001, Amount: Rs.123
✅ [WhatsApp] MSG91 Response (200): {...}
✅ [WhatsApp] Order created notification sent for ORD-001

🔄 [WhatsApp] Order ORD-001 status changed: pending -> processing
📤 [WhatsApp] Triggering Processing notification for order ORD-001
📱 [WhatsApp] Sending Order Processing to 919876543210
📄 [WhatsApp] Template: bill (bill)
🧺 [WhatsApp] Customer: John Doe, Order: ORD-001
✅ [WhatsApp] Status update notification sent for ORD-001
```
