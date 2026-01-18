# 🎯 Quick Reference - What to Run and When

## Current Status
Your database schema is created but **NO DATA** exists yet (all zeros in system health).

## What to Do Now

### **Run This SQL File:**
```
SETUP_AND_VERIFY.sql
```

This single file will:
1. ✅ Verify schema structure is correct
2. ✅ Seed initial data (franchises, employees, services)
3. ✅ Verify everything is configured properly
4. ✅ Show you login credentials

---

## How to Run

### **Step 1: Copy the File**
```bash
1. Open Supabase SQL Editor
2. Open file: SETUP_AND_VERIFY.sql
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click "Run"
```

### **Step 2: Review the Output**
Look for these key results:

#### ✅ **Expected Output:**
```json
{
  "check_name": "✅ SYSTEM HEALTH SUMMARY",
  "total_franchises": 2,
  "active_employees": 7,
  "total_services": 20,
  "total_customers": 1,
  "overall_status": "✅ SYSTEM READY"
}
```

#### ✅ **Login Credentials:**
```
Admin:
  Username: myfabclean
  Password: Durai@2025
  Role: admin

Pollachi Manager:
  Username: mgr-pol
  Password: Durai@2025
  Role: franchise_manager

Kinathukadavu Manager:
  Username: mgr-kin
  Password: Durai@2025
  Role: franchise_manager
```

---

## What Gets Created

### **2 Franchises:**
- Fab Clean Pollachi (FAB-POLLACHI)
- Fab Clean Kinathukadavu (FAB-KIN)

### **7 Employees:**
- 1 Admin (myfabclean)
- 2 Managers (mgr-pol, mgr-kin)
- 2 Drivers (drv-pol, drv-kin)
- 2 Staff (staff-pol, staff-kin)

### **20 Services:**
- 10 services for Pollachi
- 10 services for Kinathukadavu
- Categories: Ironing, Laundry, Dry Cleaning

### **1 Test Customer:**
- Walk-in Customer (Pollachi)

---

## Verification Checks

The script will automatically verify:

### ✅ **Schema Checks:**
- All 22 tables exist
- All critical columns exist (franchise_id, file_data, image_data, etc.)
- All foreign key constraints are correct
- CASCADE delete is configured

### ✅ **Data Checks:**
- Franchises seeded correctly
- Employees assigned to correct franchises
- Admin account exists and active
- Manager accounts exist and active
- Services created for both franchises

### ✅ **Isolation Checks:**
- Employees properly isolated by franchise
- No cross-franchise data leakage

---

## After Running - Test These

### **1. Test Admin Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"myfabclean","password":"Durai@2025"}'
```

### **2. Test Manager Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mgr-pol","password":"Durai@2025"}'
```

### **3. Test Password Reset**
```bash
# Get token from login first, then:
curl -X POST http://localhost:5000/api/employees/staff-pol/reset-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"NewPass123"}'
```

### **4. Test Employee Deletion (Soft)**
```bash
curl -X DELETE http://localhost:5000/api/employees/staff-pol \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### **If you see errors:**

#### **Error: "relation already exists"**
- This is OK - it means data already exists
- The script uses `ON CONFLICT DO NOTHING` to skip duplicates

#### **Error: "column does not exist"**
- Run `COMPLETE_SUPABASE_SCHEMA.sql` first
- Then run `SETUP_AND_VERIFY.sql`

#### **If overall_status shows "⚠️ INCOMPLETE SETUP"**
- Check which counts are low
- Re-run the script
- Check for error messages in Supabase logs

---

## Quick Command Summary

```bash
# 1. Run schema (if not done)
COMPLETE_SUPABASE_SCHEMA.sql

# 2. Run setup and verify (do this now)
SETUP_AND_VERIFY.sql

# 3. Check output for:
- ✅ SYSTEM READY
- total_franchises: 2
- active_employees: 7
- total_services: 20
```

---

## What to Send Me

After running `SETUP_AND_VERIFY.sql`, send me:

1. **The "SYSTEM HEALTH SUMMARY" output**
2. **The "LOGIN CREDENTIALS TEST" output**
3. **Any error messages** (if any)

I'll verify everything is configured correctly!

---

**Status**: Ready to run `SETUP_AND_VERIFY.sql` 🚀
