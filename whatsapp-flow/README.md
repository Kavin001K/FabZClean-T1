# Fab Clean WhatsApp Flow v3.0

> **Streamlined ordering experience optimized for ERP integration**

## 🚀 Flow Overview

```
┌─────────┐    ┌─────────────────┐    ┌───────────┐    ┌──────────┐    ┌────────┐    ┌──────┐
│  START  │ →  │ SELECT_SERVICE  │ →  │ ADD_ITEMS │ →  │ SCHEDULE │ →  │ REVIEW │ →  │ DONE │
└─────────┘    └─────────────────┘    └───────────┘    └──────────┘    └────────┘    └──────┘
   Name           Service Type          Items +           Address        Summary       ✅
   Phone          • Ironing             Quantity          Date           Estimate     Confirmed
   Opt-in         • Wash & Iron         Notes             Time slot      Confirm
                  • Dry Clean
                  • Express
                  • Premium
```

## ✨ Key Features

- **6 screens only** - Minimal, focused user journey
- **Smart pricing** - Real-time estimate calculation
- **ERP Ready** - Direct database integration
- **Mobile optimized** - Emoji-based visual hierarchy
- **Fast checkout** - Under 2 minutes to complete

---

## 📱 Screen Details

### 1. START - Welcome
- Customer name & phone
- WhatsApp opt-in consent
- Service overview with pricing hints

### 2. SELECT_SERVICE - Choose Service
| Service | Icon | Turnaround | Multiplier |
|---------|------|------------|------------|
| Ironing Only | ♨️ | 24 hours | 1x |
| Wash & Iron | 🧺 | 48 hours | 1.5x |
| Dry Clean | 🧥 | 72 hours | 2.5x |
| Express | ⚡ | Same day | 3x |
| Premium Care | 👔 | 48-72 hrs | 2x |

### 3. ADD_ITEMS - Select Items
| Item | Icon | Base Price |
|------|------|------------|
| Shirts/T-Shirts | 👔 | ₹20 |
| Pants/Jeans | 👖 | ₹25 |
| Sarees | 🥻 | ₹60 |
| Suit/Blazer | 🤵 | ₹150 |
| Dress/Frock | 👗 | ₹50 |
| Bedding | 🛏️ | ₹80 |
| Curtains | 🪟 | ₹70 |
| Other Items | 📦 | ₹40 |

### 4. SCHEDULE - Pickup Details
- Full address with landmark
- City & Pincode (combined)
- Date picker (next 7 days)
- Time slot selection

### 5. REVIEW - Order Summary
- Order ID displayed
- Service & items summary
- Pickup details
- Price estimate (range)
- Confirm button

### 6. DONE - Confirmation
- Success message
- Contact info
- Payment info (COD)

---

## 🔌 API Endpoints

### POST `/api/whatsapp-flow/webhook`

**Create Order:**
```json
{
  "action": "create",
  "name": "Karthik",
  "phone": "9876543210",
  "service": "wash",
  "items": ["shirt", "pant"],
  "qty": "5",
  "notes": "Handle with care",
  "address": "12, Main Street",
  "city_pin": "Pollachi 642001",
  "date": "2025-12-22",
  "slot": "am"
}
```

**Response:**
```json
{
  "screen": "REVIEW",
  "data": {
    "order_id": "FZC-211225A1B2",
    "summary": "🧺 Wash & Iron\n👕 Shirts, Pants\n📦 5 pieces",
    "pickup": "📍 12, Main Street\n🏙️ Pollachi 642001\n📅 22 Dec, Morning",
    "estimate": "₹150 - ₹200"
  }
}
```

**Confirm Order:**
```json
{
  "action": "confirm",
  "order_id": "FZC-211225A1B2"
}
```

### GET `/api/whatsapp-flow/health`
Returns flow status and version.

### GET `/api/whatsapp-flow/pricing`
Returns current pricing configuration.

---

## ⚙️ Setup

### 1. Meta Business Manager
1. Go to WhatsApp Manager → Flows
2. Create new flow: "Fab Clean - Order"
3. Upload `fabclean-order-flow.json`

### 2. Configure Endpoint
```
URL: https://your-domain.com/api/whatsapp-flow/webhook
Method: POST
```

### 3. Update Dates
Edit `fabclean-order-flow.json` line ~258:
```json
"min-date": "2025-12-22",  // Today
"max-date": "2025-12-31",  // +7 to 14 days
```

---

## 📊 ERP Integration

Orders are automatically saved with:
- Order ID: `FZC-DDMMYYXXXX`
- Status: `pending` → `confirmed`
- Source: `whatsapp`
- All customer & item details

---

## 🎨 Design Principles

1. **Less is more** - Only essential fields
2. **Visual hierarchy** - Emojis guide attention
3. **Speed** - Pre-selected defaults
4. **Trust** - Price transparency
5. **Mobile-first** - Thumb-friendly

---

## 📞 Support

**Fab Clean**
- 📞 +91 93630 59595
- 🌐 myfabclean.com
- 📍 Pollachi • Kinathukadavu • Coimbatore
