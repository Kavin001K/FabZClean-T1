# 🖨️ PRINTING FEATURES DOCUMENTATION

## Overview
The FabZClean application now has professional-grade printing capabilities for both **Bills** and **Tags**, optimized for different printer types.

---

## 📄 BILL PRINTING

### **Features:**
- ✅ Opens bill in a new tab with shareable URL (`/bill/{orderNumber}`)
- ✅ Professional A4/Letter format layout
- ✅ Premium gradient design with company branding
- ✅ Detailed order breakdown with itemized listing
- ✅ QR code for UPI payment
- ✅ Barcode for order tracking
- ✅ Print-optimized CSS with proper margins

### **Printer Support:**
- Standard office printers (A4/Letter size)
- PDF export capability
- Mobile-friendly responsive design

### **Print Settings Recommended:**
- Paper Size: A4 or Letter
- Orientation: Portrait
- Margins: Default (0.5cm)
- Color: Yes (for best appearance)
- Background Graphics: Enabled

---

## 🏷️ TAG PRINTING (Thermal Printer Optimized)

### **Features:**
- ✅ One tag per item quantity (5 shirts = 5 separate tags)
- ✅ Professional laundry tag layout
- ✅ Customer name and phone number
- ✅ Item name highlighted
- ✅ Piece counter (Item 1 of 5, Item 2 of 5, etc.)
- ✅ Order ID for tracking
- ✅ Footer with verification reminder
- ✅ Page breaks between each tag

### **Tag Layout:**
```
┌─────────────────────────┐
│      FabZClean          │
│    LAUNDRY TAG          │
├─────────────────────────┤
│ Customer: John Doe      │
│ Phone: 08825702072      │
│ ┌───────────────────┐   │
│ │ Item: Shirt       │   │
│ └───────────────────┘   │
│ Piece: 1 of 5           │
│ Order ID: ORD-123456    │
├─────────────────────────┤
│ Please verify items     │
│ before leaving          │
└─────────────────────────┘
```

### **Printer Support:**
- ✅ **58mm thermal printers** (default) - Most common POS printers
- ✅ **80mm thermal printers** - Larger format with auto-scaling
- ✅ Standard printers (fallback)

### **Print Settings for Thermal Printers:**

#### **58mm Thermal Printer:**
- Paper Size: 58mm width, continuous
- Orientation: Portrait
- Margins: None (borderless)
- Scale: 100%
- Quality: Standard

#### **80mm Thermal Printer:**
- Paper Size: 80mm width, continuous
- Orientation: Portrait  
- Margins: None (borderless)
- Scale: 100%
- Quality: Standard

### **Compatible Thermal Printer Models:**
- Epson TM-T88 series
- Star Micronics TSP series
- Citizen CT-S series
- Bixolon SRP series
- Generic ESC/POS printers

---

## 🚀 HOW TO USE

### **Print Bill:**
1. Create an order
2. In the confirmation dialog, click **"Print Bill"**
3. A new tab opens with the professional bill
4. Click browser's Print button (or Ctrl/Cmd+P)
5. Select your printer and print

### **Print Tags:**
1. Create an order with items
2. In the confirmation dialog, click **"Print Tags"**
3. A new window opens with all tags (one per item piece)
4. Print dialog automatically opens
5. **Select your thermal printer** from the list
6. Set paper size to 58mm or 80mm
7. Print!

### **Send on WhatsApp:**
1. Create an order
2. Click **"Send on WhatsApp"**
3. WhatsApp opens with pre-filled message including:
   - Order number
   - Total amount
   - Direct link to view/download bill
4. Send to customer

---

## 🔧 PRINTER SETUP GUIDE

### **Windows:**
1. Install thermal printer drivers from manufacturer
2. Set paper size to 58mm or 80mm in printer preferences
3. Set as default printer (optional)
4. Test print from browser

### **Mac:**
1. Add thermal printer via System Preferences > Printers
2. Download drivers if needed
3. Select Custom Paper Size: 58mm or 80mm
4. Test print

### **Linux:**
1. Install CUPS and thermal printer drivers
2. Configure paper size in CUPS interface
3. Set printer permissions
4. Test print

---

## 💡 TIPS & BEST PRACTICES

### **For Tags:**
- Use **durable thermal paper** for tags that will be washed
- Consider **waterproof tag holders** for extra protection
- Print in **batches** for efficiency
- Keep a **spare paper roll** handy

### **For Bills:**
- Use **color printing** for professional appearance
- Enable **background graphics** for full design
- Consider **PDF export** for email delivery
- Keep **digital backup** via bill URL

### **For Best Results:**
- Always **test print** one tag first
- Check **printer connectivity** before bulk printing
- Ensure **paper is loaded correctly**
- Keep printer **drivers updated**
- Use **genuine thermal paper** for longevity

---

## 🐛 TROUBLESHOOTING

### **Tags Not Printing:**
- ✅ Check if pop-ups are blocked
- ✅ Verify thermal printer is connected
- ✅ Ensure paper is loaded
- ✅ Try refreshing and printing again

### **Blank Pages:**
- ✅ Enable "Background graphics" in print settings
- ✅ Check printer ink/thermal paper
- ✅ Clear browser cache

### **Wrong Size:**
- ✅ Set paper size to 58mm or 80mm in print dialog
- ✅ Disable "Fit to page" scaling
- ✅ Check printer default settings

### **Tags Cut Off:**
- ✅ Reduce browser zoom to 100%
- ✅ Set margins to "None"
- ✅ Check printer paper feed

---

## 📞 SUPPORT

For technical issues with printing:
1. Check this documentation
2. Test with different printers
3. Check browser console for errors (F12)
4. Contact FabZClean technical support

---

**Last Updated:** 2025-11-26
**Version:** 1.0
