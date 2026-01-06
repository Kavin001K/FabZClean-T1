# ⚡ QUICK FIX - Do This Now!

## 🎯 3 Steps to Fix Everything

### **Step 1: Run SQL** (30 seconds)
```
1. Open Supabase SQL Editor
2. Copy contents of: FIX_ADMIN_ISOLATION.sql
3. Paste and click "Run"
4. Check output shows admin franchise_id = NULL
```

### **Step 2: Restart Backend** (10 seconds)
```bash
# Stop backend (Ctrl+C)
npm run dev
```

### **Step 3: Test** (1 minute)
```
1. Login as: mgr-pol / Durai@2025
2. Go to Franchise Dashboard → Attendance tab
3. ✅ Should see 3 employees (NOT 4)
4. ✅ Click Eye icon → Opens dialog
5. ✅ Click "Late" button → Changes status
```

---

## ✅ What's Fixed

1. **✅ Admin Isolation** - Admin won't appear in manager views
2. **✅ Eye Icon** - Now opens attendance detail dialog
3. **✅ Editable Attendance** - Can change status anytime

---

## 🎉 Done!

After these 3 steps:
- Admin isolated properly
- Eye icon works
- Attendance editable
- Isolation perfect

**Time:** 2 minutes total ⏱️
