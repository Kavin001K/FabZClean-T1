# ⚠️ IMPORTANT: Schema Update Required

## Error: Column "file_data" does not exist

This error occurs because your database has the **old schema** with `filepath` column, but the new implementation uses `file_data` column.

## Solution: Run the Complete Schema

You **MUST** run `COMPLETE_SUPABASE_SCHEMA.sql` **FIRST** before running the verification script.

### Step-by-Step Fix:

#### 1. **Backup Your Data** (if you have existing data)
```sql
-- Backup existing documents
CREATE TABLE documents_backup AS SELECT * FROM documents;

-- Backup existing barcodes  
CREATE TABLE barcodes_backup AS SELECT * FROM barcodes;
```

#### 2. **Run the Complete Schema**
```bash
1. Open Supabase SQL Editor
2. Copy ALL contents of COMPLETE_SUPABASE_SCHEMA.sql
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "Success" message
```

This will:
- Drop all existing tables
- Create new tables with correct schema
- Add all indexes and constraints
- Set up RLS policies

#### 3. **Restore Data** (if you backed up)
```sql
-- Restore documents (map old columns to new)
INSERT INTO documents (
    id, franchise_id, type, title, filename,
    file_data,  -- NEW COLUMN
    file_url,
    status, amount, customer_name, order_number,
    metadata, created_at, updated_at
)
SELECT 
    id, franchise_id, type, title, filename,
    NULL as file_data,  -- Old schema didn't have this
    file_url,
    status, amount, customer_name, order_number,
    metadata, created_at, updated_at
FROM documents_backup;

-- Drop backup
DROP TABLE documents_backup;
DROP TABLE barcodes_backup;
```

#### 4. **Run Verification Script**
```bash
1. Copy ALL contents of VERIFICATION_SCRIPT.sql
2. Paste into SQL Editor
3. Click "Run"
4. Check results - all critical tests should return 0 rows
```

## What Changed?

### Documents Table
**OLD Schema:**
```sql
CREATE TABLE documents (
    ...
    filepath TEXT NOT NULL,  -- OLD
    file_url TEXT NOT NULL,  -- OLD
    ...
);
```

**NEW Schema:**
```sql
CREATE TABLE documents (
    ...
    file_data TEXT,  -- NEW: Base64 encoded PDF/image
    file_url TEXT,   -- NEW: Supabase storage URL
    ...
);
```

### Barcodes Table
**OLD Schema:**
```sql
CREATE TABLE barcodes (
    ...
    image_path TEXT,  -- OLD
    ...
);
```

**NEW Schema:**
```sql
CREATE TABLE barcodes (
    ...
    image_data TEXT,  -- NEW: Base64 encoded barcode image
    image_url TEXT,   -- NEW: Supabase storage URL
    ...
);
```

## Why This Change?

1. **Flexibility**: Support both Base64 encoding (for small files) and Supabase Storage URLs (for large files)
2. **Consistency**: Same pattern for both documents and barcodes
3. **Storage Options**: Choose between database storage (Base64) or file storage (URL)

## Alternative: Skip Document Verification

If you don't want to recreate the schema right now, you can comment out the document/barcode tests in the verification script:

```sql
-- Comment out Test 16, 17, 18 (lines 214-248)
/*
-- Test 16: Verify documents are stored
SELECT ...
FROM documents
...

-- Test 17: Verify barcodes are stored with images
SELECT ...
FROM barcodes
...

-- Test 18: Verify order-document linkage
SELECT ...
FROM orders o
JOIN documents d ON o.id = d.order_id
...
*/
```

Then run the verification script without those tests.

## Recommended Approach

**Best Practice**: Run the complete schema to get all the new features:
- ✅ Proper franchise isolation
- ✅ Password reset functionality
- ✅ User deletion functionality
- ✅ Document storage with Base64 support
- ✅ Barcode storage with image support
- ✅ All constraints and indexes

---

**Next Steps:**
1. Backup your data (if any)
2. Run `COMPLETE_SUPABASE_SCHEMA.sql`
3. Restore data (if needed)
4. Run `VERIFICATION_SCRIPT.sql`
5. Verify all tests pass

**Status**: Schema update required before verification
