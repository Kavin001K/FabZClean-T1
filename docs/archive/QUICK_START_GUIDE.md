# 🚀 QUICK START GUIDE - Invoice & Document System

## ⚡ 3-Minute Setup

### 1️⃣ Run Database Migration (1 minute)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `CREATE_DOCUMENTS_TABLE.sql`
4. Click "Run"
5. You should see "Documents table created successfully!"

### 2️⃣ Install Dependencies (30 seconds)

```bash
cd server
npm install multer @types/multer
```

### 3️⃣ Register Route (30 seconds)

Open `/server/index.ts` and add:

```typescript
import documentsRouter from './routes/documents';

// Add with other routes:
app.use('/api/documents', documentsRouter);
```

### 4️⃣ Test It! (1 minute)

1. Start your server: `npm run dev`
2. Navigate to: `http://localhost:5001/test-invoice`
3. Click "Generate Test Invoice"
4. ✅ PDF should download
5. ✅ Check Supabase storage for the file
6. ✅ Check documents table for the record

## 📝 Update Your Information (5 minutes)

### Company Details

**File:** `/client/src/lib/print-driver.ts` (line ~180)

```typescript
const companyInfo = {
  name: "FabZClean",
  address: "YOUR_ADDRESS_HERE\nCity, State, PIN\nIndia",
  phone: "YOUR_PHONE",
  email: "YOUR_EMAIL",
  website: "YOUR_WEBSITE",
  taxId: "YOUR_GSTIN"
};
```

### Bank Details

**File:** `/client/src/components/print/invoice-template-in.tsx` (line ~327)

```typescript
<p><span className="font-semibold">Bank Name:</span> YOUR_BANK</p>
<p><span className="font-semibold">Account No:</span> YOUR_ACCOUNT</p>
<p><span className="font-semibold">IFSC Code:</span> YOUR_IFSC</p>
<p><span className="font-semibold">Branch:</span> YOUR_BRANCH</p>
```

## 🎯 How to Use

### Generate Invoice from Order

1. Go to `/orders`
2. Find any order
3. Click the **printer icon** 🖨️
4. Invoice generates and downloads
5. Also saved to server automatically!

### View Saved Documents

1. Go to `/documents`
2. See all your invoices
3. Click "Download" to get PDF again
4. Search by customer or order number
5. Filter by status

### Test Page

1. Go to `/test-invoice` (admin only)
2. See sample order data
3. Click "Generate Test Invoice"
4. Perfect for testing!

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Multer installed
- [ ] Documents route registered
- [ ] Server restarted
- [ ] Test invoice generated successfully
- [ ] PDF appears in Supabase storage
- [ ] Record created in documents table
- [ ] Can download invoice again from /documents

## 🆘 Troubleshooting

### "Failed to upload PDF"
- Check Supabase credentials in `.env`
- Verify storage bucket `pdfs` exists
- Check bucket permissions

### "Template not found"
- Clear browser cache
- Restart dev server
- Check import paths

### "Documents not showing"
- Verify database migration ran
- Check API endpoint: `http://localhost:5001/api/documents`
- Look for errors in browser console

## 📞 Need Help?

Check these files for detailed information:
- `COMPLETE_SOLUTION_SUMMARY.md` - Full overview
- `DOCUMENT_STORAGE_IMPLEMENTATION.md` - Technical details
- `INVOICE_TEMPLATE_FIX.md` - Invoice template info

## 🎉 You're Done!

Your invoice system is now:
- ✅ Professional and complete
- ✅ Automatically saved to server
- ✅ Accessible anytime from Documents page
- ✅ GST-compliant for India
- ✅ Ready for production!

**Next:** Update your company info and start generating invoices! 🚀
