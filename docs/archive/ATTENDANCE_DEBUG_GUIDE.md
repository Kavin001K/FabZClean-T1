# 🔍 ATTENDANCE DEBUG GUIDE

## 🐛 Issue: P, L, A Buttons Not Working

**Symptoms:**
- Click "P" (Present) → Nothing happens
- Click "L" (Late) → Nothing happens  
- Click "A" (Absent) → Works sometimes

---

## ✅ What I Just Fixed

### **Added Detailed Logging**

Now when you click P, L, or A buttons, you'll see in the browser console (F12):

```javascript
handleMarkAttendance called: {
  employeeId: "emp-123",
  status: "present",
  franchiseId: "franchise-pollachi",
  selectedDate: "2025-12-08"
}

Sending attendance payload: {
  employeeId: "emp-123",
  date: "2025-12-08T00:00:00.000Z",
  status: "present",
  clockIn: "2025-12-08T18:10:00.000Z",
  locationCheckIn: { type: "manual", by: "manager-id" }
}

Attendance marked successfully: { ... }
```

---

## 🧪 How to Debug

### **Step 1: Open Browser Console**
```
1. Press F12 (or Cmd+Option+I on Mac)
2. Click "Console" tab
3. Clear console (trash icon)
```

### **Step 2: Click a Button**
```
1. Click "P" button on any employee
2. Watch console for logs
```

### **Step 3: Check for Errors**

**If you see:**
```javascript
handleMarkAttendance called: { ... }
Sending attendance payload: { ... }
Attendance marked successfully: { ... }
```
✅ **Frontend is working!** Issue is in backend or database.

**If you see:**
```javascript
No franchise ID available
```
❌ **Problem:** User not logged in properly or franchise ID missing.

**If you see:**
```javascript
Failed to mark attendance: Error: ...
```
❌ **Problem:** Backend error. Check server logs.

**If you see nothing:**
❌ **Problem:** Button click not firing. Check if page loaded correctly.

---

## 🔧 Common Issues & Fixes

### **Issue 1: No Logs Appear**
**Problem:** JavaScript not loaded or page cached

**Fix:**
```
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear cache and reload
3. Check Network tab for 404 errors
```

### **Issue 2: "No franchise ID available"**
**Problem:** User context missing

**Fix:**
```
1. Logout and login again
2. Check if you're logged in as franchise manager
3. Verify franchise assignment in database
```

### **Issue 3: Backend Error**
**Problem:** Server-side issue

**Fix:**
```
1. Check server terminal for errors
2. Verify server is running on port 5001
3. Check if updateAttendance function exists in storage
```

### **Issue 4: Network Error**
**Problem:** API call failing

**Fix:**
```
1. Open Network tab in DevTools
2. Click button
3. Look for failed requests (red)
4. Check request/response details
```

---

## 📊 Expected Flow

### **When Working Correctly:**

```
1. User clicks "P" button
   ↓
2. handleMarkAttendance called
   Console: "handleMarkAttendance called: { ... }"
   ↓
3. Payload created
   Console: "Sending attendance payload: { ... }"
   ↓
4. API call to backend
   POST /api/franchises/:id/attendance
   ↓
5. Backend checks for existing attendance
   Console (server): "Marking attendance: { ... }"
   ↓
6. Backend updates or creates record
   Console (server): "Updating existing attendance: att-123"
   ↓
7. Response received
   Console: "Attendance marked successfully: { ... }"
   ↓
8. UI refreshes
   - Query invalidated
   - Query refetched
   - Badge appears: ✅ present
   ↓
9. Toast notification
   "Attendance Saved - Marked as present for December 8th, 2025"
```

---

## 🎯 Testing Steps

### **Test 1: Check Logs**
```
1. Open console (F12)
2. Click "P" on Senthil Kumar
3. Should see 3 console logs
4. Should see toast notification
5. Should see green badge appear
```

### **Test 2: Check Network**
```
1. Open Network tab
2. Click "L" on Ramesh Driver
3. Should see POST request to /api/franchises/.../attendance
4. Status should be 201 Created
5. Response should have attendance object
```

### **Test 3: Check Database**
```sql
-- Check if record was created/updated
SELECT * FROM employee_attendance
WHERE employee_id = 'emp-id'
AND date = '2025-12-08'
ORDER BY updated_at DESC
LIMIT 1;

-- Should show latest status
```

---

## 🚨 If Still Not Working

### **Check Server Logs:**
```bash
# In terminal where npm run dev is running
# Look for:
Marking attendance: { ... }
Updating existing attendance: att-123
Attendance saved: { ... }
```

### **Check for TypeScript Errors:**
```bash
# Look for compilation errors in terminal
# Should see: "Compiled successfully"
```

### **Restart Everything:**
```bash
# Stop server (Ctrl+C)
npm run dev

# Hard refresh browser
Cmd+Shift+R
```

---

## ✅ Success Indicators

**When it's working, you'll see:**

1. ✅ Console logs appear
2. ✅ Toast notification shows
3. ✅ Badge appears immediately
4. ✅ Attendance summary updates
5. ✅ No errors in console
6. ✅ Network request succeeds (201)

---

## 📝 Quick Checklist

- [ ] Browser console open (F12)
- [ ] Server running (npm run dev)
- [ ] Logged in as franchise manager
- [ ] Date selected in calendar
- [ ] Click P/L/A button
- [ ] Check console for logs
- [ ] Check for toast notification
- [ ] Check if badge appears
- [ ] Check server terminal for logs

---

**Next Step:** Open browser console and click a button. Share what you see! 🔍
