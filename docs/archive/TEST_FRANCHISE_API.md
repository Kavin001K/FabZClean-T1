# 🧪 Test Franchise API

## Quick Test to See What's Wrong

Run these commands to debug:

### **1. Test if backend is running:**
```bash
curl http://localhost:5000/api/franchises
```

**Expected Output:**
```json
[
  {
    "id": "franchise-pollachi",
    "franchiseId": "FAB-POLLACHI",
    "name": "Fab Clean Pollachi",
    "ownerName": "Manager Pollachi",
    "email": "pollachi@fabzclean.com",
    ...
  },
  {
    "id": "franchise-kinathukadavu",
    "franchiseId": "FAB-KIN",
    "name": "Fab Clean Kinathukadavu",
    ...
  }
]
```

### **2. If you get an error:**

#### **Error: "Connection refused"**
- Backend is not running
- Start it with: `npm run dev`

#### **Error: "404 Not Found"**
- Route not registered
- Check `server/index.ts` has: `app.use("/api/franchises", franchiseRoutes);`

#### **Error: "Empty array []"**
- Data exists but not being returned
- Run the SQL again: `CREATE_TWO_FRANCHISES.sql`

### **3. Test in Browser Console:**

Open browser (http://localhost:5173), press F12, and run:

```javascript
fetch('/api/franchises')
  .then(r => r.json())
  .then(data => {
    console.log('Franchises:', data);
    console.log('Count:', data.length);
    console.log('First franchise:', data[0]);
  })
  .catch(err => console.error('Error:', err));
```

### **4. Check React Query DevTools:**

In your app, open React Query DevTools (bottom right corner) and check:
- Query Key: `["franchises"]`
- Status: Should be "success"
- Data: Should show 2 franchises

---

## 🔧 Most Likely Fix:

The issue is probably that you need to **restart your backend server** after running the SQL.

```bash
# Stop the backend (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Verification Checklist:

- [ ] Backend is running on port 5000
- [ ] SQL script created 2 franchises
- [ ] API returns 2 franchises
- [ ] Frontend shows 2 franchises in table

If all checked, the issue is fixed! 🎉
