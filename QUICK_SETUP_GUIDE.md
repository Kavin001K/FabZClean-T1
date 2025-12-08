# 🚀 FabZClean - Quick Setup Guide

## Prerequisites
- Supabase account with project created
- Database access to Supabase SQL Editor

## Step-by-Step Setup

### 1. **Run the Complete Schema** (5 minutes)

1. Open your Supabase project
2. Navigate to **SQL Editor**
3. Open the file: `COMPLETE_SUPABASE_SCHEMA.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. Wait for completion (should see "Success")

### 2. **Verify Installation** (2 minutes)

1. Open the file: `VERIFICATION_SCRIPT.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Review the results:
   - ✅ **CROSS-FRANCHISE ATTENDANCE LEAKAGE**: Should return 0 rows
   - ✅ **CROSS-FRANCHISE TASK LEAKAGE**: Should return 0 rows
   - ✅ **DUPLICATE ATTENDANCE CHECK**: Should return 0 rows
   - ✅ **ORPHANED RECORDS**: Should return 0 rows

### 3. **Update Environment Variables** (1 minute)

Add to your `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_secure_jwt_secret
```

### 4. **Test the API** (3 minutes)

#### Test Password Reset
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"myfabclean","password":"Durai@2025"}'

# Reset employee password
curl -X POST http://localhost:5000/api/employees/mgr-pol/reset-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"NewPass123"}'
```

#### Test Employee Deletion
```bash
# Soft delete (deactivate)
curl -X DELETE http://localhost:5000/api/employees/staff-pol \
  -H "Authorization: Bearer YOUR_TOKEN"

# Hard delete (admin only)
curl -X DELETE "http://localhost:5000/api/employees/staff-pol?hardDelete=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Attendance
```bash
# Mark attendance
curl -X POST http://localhost:5000/api/franchises/franchise-pollachi/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "mgr-pol",
    "date": "2025-12-08",
    "status": "present",
    "clockIn": "2025-12-08T09:00:00Z"
  }'

# Get attendance
curl -X GET "http://localhost:5000/api/franchises/franchise-pollachi/attendance?date=2025-12-08" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Key Features Implemented

### ✅ Franchise Isolation
- All employee data strictly isolated by franchise
- Attendance records scoped to franchise
- Tasks scoped to franchise
- Audit logs scoped to franchise

### ✅ Password Management
- **Admin**: Can reset any employee password
- **Manager**: Can reset passwords in their franchise only
- **Employee**: Can change their own password

### ✅ User Management
- **Admin**: Can hard delete any employee
- **Manager**: Can soft delete employees in their franchise
- **Soft Delete**: Deactivates account, preserves data
- **Hard Delete**: Permanently removes account (admin only)

### ✅ Data Storage
- **Bills**: Stored in `documents` table with Base64 or URL
- **QR Codes**: Stored in `documents` table
- **Barcodes**: Stored in `barcodes` table with image data

### ✅ Security
- All sensitive operations logged in `audit_logs`
- Foreign key constraints with CASCADE delete
- Unique constraints prevent duplicates
- Row Level Security (RLS) enabled

## 📊 Database Structure

### Core Tables
- `franchises` - Franchise information
- `employees` - Employee records (with franchise_id)
- `employee_attendance` - Attendance records (with franchise_id)
- `employee_tasks` - Task assignments (with franchise_id)
- `audit_logs` - Security audit trail (with franchise_id)
- `documents` - Bills, invoices, QR codes
- `barcodes` - Barcode data with images

### Key Relationships
```
franchises
  ├── employees (ON DELETE CASCADE)
  │   ├── employee_attendance (ON DELETE CASCADE)
  │   ├── employee_tasks (ON DELETE CASCADE)
  │   └── employee_performance (ON DELETE CASCADE)
  ├── orders (ON DELETE CASCADE)
  │   └── documents (ON DELETE SET NULL)
  └── audit_logs (ON DELETE CASCADE)
```

## 🔍 Troubleshooting

### Issue: "Cross-franchise leakage detected"
**Solution**: Run the verification script and check which records have mismatched franchise_ids. Update them manually:
```sql
UPDATE employee_attendance 
SET franchise_id = (SELECT franchise_id FROM employees WHERE id = employee_attendance.employee_id)
WHERE franchise_id != (SELECT franchise_id FROM employees WHERE id = employee_attendance.employee_id);
```

### Issue: "Duplicate attendance records"
**Solution**: The unique constraint should prevent this. If it occurs, delete duplicates:
```sql
DELETE FROM employee_attendance 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM employee_attendance 
  GROUP BY employee_id, date
);
```

### Issue: "Password reset fails"
**Solution**: Check authorization:
1. Verify the user has admin or manager role
2. Verify manager is resetting password in their franchise
3. Check audit logs for error details

### Issue: "Cannot delete employee"
**Solution**: Check:
1. User has admin or manager role
2. Not trying to delete own account
3. Manager not trying to delete admin
4. Manager not trying to delete employee from different franchise

## 📝 Default Credentials

### Admin Account
- **Username**: `myfabclean`
- **Password**: `Durai@2025`
- **Email**: `admin@myfabclean.com`
- **Franchise**: Pollachi

### Manager Accounts
- **Pollachi Manager**
  - Username: `mgr-pol`
  - Password: `Durai@2025`
  - Email: `manager.pollachi@fabzclean.com`

- **Kinathukadavu Manager**
  - Username: `mgr-kin`
  - Password: `Durai@2025`
  - Email: `manager.kin@fabzclean.com`

## 🎉 Success Criteria

Your setup is successful if:
- ✅ All verification tests pass (0 rows for critical tests)
- ✅ You can login as admin
- ✅ You can reset employee passwords
- ✅ You can delete/deactivate employees
- ✅ Attendance records are franchise-scoped
- ✅ Managers can only see their franchise data
- ✅ All operations are logged in audit_logs

## 📞 Support

If you encounter issues:
1. Check the `ISOLATION_AND_SECURITY_IMPLEMENTATION.md` for detailed documentation
2. Run the `VERIFICATION_SCRIPT.sql` to identify issues
3. Review Supabase logs for errors
4. Check the audit_logs table for operation history

---

**Setup Time**: ~10 minutes
**Difficulty**: Easy
**Status**: Production Ready ✅
