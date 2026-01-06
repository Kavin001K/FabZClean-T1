# 🔧 CRITICAL ATTENDANCE & ISOLATION FIXES

## Issues from Screenshot

### ❌ **Issue 1: Admin Showing in Pollachi Manager's View**
- System Admin appears in manager's attendance list
- **ISOLATION BROKEN**

### ❌ **Issue 2: Eye Icon Not Working**
- Button has no functionality

### ❌ **Issue 3: Attendance Not Editable**
- Cannot change status after marking

---

## 🎯 QUICK FIX - Run This SQL First

```sql
-- Fix admin isolation
UPDATE employees 
SET franchise_id = NULL 
WHERE role = 'admin';

-- Verify
SELECT employee_id, role, franchise_id 
FROM employees 
WHERE role = 'admin';
-- Should show franchise_id as NULL
```

---

## 📝 Files to Modify

1. `server/routes/franchise.ts` - Add admin filter
2. `client/src/pages/franchise-dashboard.tsx` - Add eye icon handler & edit functionality

---

## ✅ Expected After Fixes

- Admin NOT in manager views
- Eye icon opens detail dialog
- Can edit attendance status
