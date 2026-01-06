# WhatsApp API Quick Setup Guide

## mygreentick.co.in Integration

### Your API Credentials
- **Access Token:** `679765b5a5b37`
- **Base URL:** `https://mygreentick.co.in/api`

---

## Quick Setup (5 Minutes)

### Step 1: Create WhatsApp Instance
Run this in your browser or API client (Postman/cURL):

```bash
curl -X POST "https://mygreentick.co.in/api/create_instance?access_token=679765b5a5b37"
```

**Response Example:**
```json
{
  "status": "success",
  "instance_id": "ABC123DEF456",
  "message": "Instance created successfully"
}
```

**Save this `instance_id`!** You'll need it for all other operations.

---

### Step 2: Get QR Code to Login

```bash
curl -X POST "https://mygreentick.co.in/api/get_qrcode?instance_id=YOUR_INSTANCE_ID&access_token=679765b5a5b37"
```

**Or open in browser:**
```
https://mygreentick.co.in/api/get_qrcode?instance_id=YOUR_INSTANCE_ID&access_token=679765b5a5b37
```

1. Open this URL in your browser
2. Scan the QR code with your **WhatsApp Business** app:
   - Open WhatsApp
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code

---

### Step 3: Update Your App Configuration

Edit this file: `/client/src/lib/whatsapp-service.ts`

Find this section (around line 2-6):
```typescript
const WHATSAPP_CONFIG = {
  baseUrl: 'https://mygreentick.co.in/api',
  accessToken: '679765b5a5b37',
  instanceId: '609ACF283XXXX', // ← CHANGE THIS
};
```

**Replace** `609ACF283XXXX` with your actual `instance_id` from Step 1.

Example:
```typescript
instanceId: 'ABC123DEF456',  // Your actual instance ID
```

---

### Step 4: Test It!

1. **Start your app** (if not already running):
   ```bash
   npm run dev
   ```

2. **Create a test order:**
   - Go to "Create Order"
   - Add a customer with a valid phone number
   - Add some items
   - Submit the order

3. **Click "Send on WhatsApp"** in the confirmation dialog

4. **Check:**
   - You should see a success message
   - The customer should receive a WhatsApp message instantly!

---

## API Endpoints Reference

### Create Instance
```
POST https://mygreentick.co.in/api/create_instance?access_token=679765b5a5b37
```

### Get QR Code
```
POST https://mygreentick.co.in/api/get_qrcode?instance_id=YOUR_ID&access_token=679765b5a5b37
```

### Send Text Message
```
POST https://mygreentick.co.in/api/send?number=919876543210&type=text&message=Hello&instance_id=YOUR_ID&access_token=679765b5a5b37
```

### Send Image/File
```
POST https://mygreentick.co.in/api/send?number=919876543210&type=media&message=Check this&media_url=https://example.com/image.jpg&instance_id=YOUR_ID&access_token=679765b5a5b37
```

### Reconnect (if disconnected)
```
POST https://mygreentick.co.in/api/reconnect?instance_id=YOUR_ID&access_token=679765b5a5b37
```

### Reboot Instance
```
POST https://mygreentick.co.in/api/reboot?instance_id=YOUR_ID&access_token=679765b5a5b37
```

---

## Troubleshooting

### ❌ "WhatsApp send failed"
**Solution:** 
1. Make sure you scanned the QR code
2. Try reconnecting:
   ```
   POST https://mygreentick.co.in/api/reconnect?instance_id=YOUR_ID&access_token=679765b5a5b37
   ```

### ❌ "Invalid instance_id"
**Solution:** 
1. Create a new instance (Step 1)
2. Update the `instance_id` in your code

### ❌ QR Code not appearing
**Solution:**
1. Check if the URL is correct
2. Try creating a new instance
3. Use browser instead of cURL to see the QR

### ⚠️ Message sent but customer didn't receive
**Solution:**
1. Verify phone number format (should be: 919876543210)
2. Check if customer has WhatsApp
3. Look at browser console for API response

---

## Phone Number Format

### ❌ Wrong Formats:
- `+91 98765 43210` (spaces)
- `98765-43210` (hyphens)
- `9876543210` (missing country code)

### ✅ Correct Format for API:
- `919876543210`

**Note:** Our code automatically formats it! Just provide the customer's phone as-is.

---

## Advanced Features

### Set Webhook (Optional)
Get notified when messages are received:
```
POST https://mygreentick.co.in/api/set_webhook?webhook_url=YOUR_WEBHOOK_URL&enable=true&instance_id=YOUR_ID&access_token=679765b5a5b37
```

### Send to Group
```
POST https://mygreentick.co.in/api/send_group?group_id=123456-789@g.us&type=text&message=Hello&instance_id=YOUR_ID&access_token=679765b5a5b37
```

---

## Best Practices

### ✅ DO:
- Keep your instance logged in
- Format phone numbers correctly
- Test with your own number first
- Keep access token secure

### ❌ DON'T:
- Share your access token publicly
- Spam customers with messages
- Use personal WhatsApp (use Business account)
- Send messages to incorrect numbers

---

## Cost & Limits

Check with mygreentick.co.in for:
- Message limits per day
- API rate limits
- Pricing details

---

## Need Help?

1. **Check browser console** for detailed error logs
2. **Check API response** in Network tab
3. **Verify QR code is scanned** and instance is active
4. **Contact mygreentick.co.in support** for API issues

---

## Quick Test Script

Run this in browser console after setup:

```javascript
// Test if WhatsApp service is working
const testPhone = '919876543210'; // Your test number
const testMessage = 'Hello from FabZClean! This is a test message.';

WhatsAppService.sendText(testPhone, testMessage)
  .then(success => {
    if (success) {
      console.log('✅ WhatsApp test successful!');
    } else {
      console.log('❌ WhatsApp test failed');
    }
  });
```

---

**You're all set! 🎉**

Now when customers place orders, they'll automatically receive WhatsApp notifications with their bill details!
