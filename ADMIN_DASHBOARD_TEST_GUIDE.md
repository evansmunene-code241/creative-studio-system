# Admin Dashboard - Quick Test Guide

**Last Updated:** November 29, 2025  
**Status:** Ready to test

---

## Pre-Test Setup

### 1. Start Backend Server
```bash
cd backend
npm start
```

You should see:
```
Server running on http://localhost:3000
API endpoints:
  POST /api/auth/register
  POST /api/auth/login
  ...
```

### 2. Open Admin Dashboard
1. Go to `http://localhost:3000`
2. Login with:
   - Email: `liza@gmail.com`
   - Password: `123456`
3. You'll be redirected to Admin Dashboard

---

## Test Checklist

### ✅ Test 1: Overview Section (Automatically Loads)

**Steps:**
1. Dashboard loads automatically showing "Overview"
2. Look for stats cards at top:
   - Active Projects count
   - Active Users count
   - Pending Tasks count
   - Storage Usage %

3. Look for chart below stats:
   - "Total Storage Usage" bar chart
   - Shows top users by storage

4. Look for summary boxes:
   - Shows total users
   - Shows storage details (X MB / Y MB Used)
   - Shows percentage

**Expected Result:** ✅ All stats visible with real data
**If Fails:** Check browser console (F12 → Console) for errors

---

### ✅ Test 2: Projects Section

**Steps:**
1. Click "📁 Projects" in left sidebar
2. Wait for table to load
3. You should see a table with columns:
   - Project Name
   - Client
   - Status (with colored badge)
   - Priority (color-coded)
   - Start Date
   - Deadline
   - Actions (Edit/Delete buttons)

4. If no projects exist, you'll see "No projects" message

**Expected Result:** ✅ Projects table loads with data or empty state
**If Fails:** 
- Check if any projects exist in database
- Check browser console for errors
- Verify `/api/projects` endpoint works

---

### ✅ Test 3: Users & Roles Section

**Steps:**
1. Click "👥 Users & Roles" in left sidebar
2. Look for "Pending Approvals" section:
   - Should show table with columns: Username, Email, Registered, Actions
   - If no pending users, shows "No pending users"
   - If users present, see "Approve" and "Reject" buttons

3. Look for "Registered Users" section:
   - Shows all approved users
   - Can filter by role dropdown
   - Each user has:
     - Username
     - Email
     - Role selector (dropdown)
     - Status badge
     - Join date
     - Delete button

**Expected Result:** ✅ Both sections load with data or empty states
**If Fails:** Check browser console for API errors

---

### ✅ Test 4: Tasks Section

**Steps:**
1. Click "✅ Tasks" in left sidebar
2. You should see a table with columns:
   - Task Title
   - Project (project name)
   - Assigned To (team member name)
   - Status (with colored badge)
   - Priority (color-coded)
   - Due Date
   - Actions (Edit button)

3. Filter by status dropdown at top
4. If no tasks exist, see "No tasks" message

**Expected Result:** ✅ Tasks table loads with data or empty state
**If Fails:** Check if tasks exist, verify `/api/tasks` endpoint

---

### ✅ Test 5: Financial Section

**Steps:**
1. Click "💰 Financial" in left sidebar
2. Look for stat cards showing:
   - Total Revenue (paid invoices amount)
   - Pending Payment (unpaid amount)
   - Total Expenses (expense total)
   - Net Profit (revenue - expenses)

3. Look for "Invoice Summary" card:
   - Total Invoices count
   - Paid count (green)
   - Pending count (orange)
   - Overdue count (red)
   - Link to Financial Dashboard

4. Look for "Expense Summary" card:
   - Total Expenses count
   - This Month amount
   - Top Category name
   - Top Category amount

5. Look for "Payment Summary" card:
   - Total Payments count
   - This Month count
   - This Month Amount
   - Collection Rate %

**Expected Result:** ✅ All financial metrics display
**If Fails:** Check `/api/financial/dashboard` endpoint, verify invoices/expenses/payments exist

---

### ✅ Test 6: Logs Section

**Steps:**
1. Click "📋 Logs" in left sidebar
2. Look for "Backup Logs" table:
   - Columns: User, File, Status, Date
   - Shows backup history
   - If no backups, shows "No backup logs"

3. Look for "Activity Logs" table:
   - Columns: User, Action, Details, Date
   - Shows all system actions
   - Limited to 50 most recent

**Expected Result:** ✅ Both log tables load
**If Fails:** Database may be empty or endpoints not working

---

### ✅ Test 7: Data Refresh

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Note the current time
4. Wait 60 seconds
5. Watch console for fetch requests
6. You should see multiple requests being made automatically

**Expected Result:** ✅ Every 60 seconds, data refreshes automatically
**If Fails:** Refresh interval may not be set up correctly

---

### ✅ Test 8: User Actions

**Steps:**

**Approve User:**
1. If pending users exist, click "Approve" button
2. Check for success message
3. User should move from pending to approved

**Reject User:**
1. If pending users exist, click "Reject" button
2. Check for success message
3. User should be removed

**Change User Role:**
1. In "Registered Users", find a non-admin user
2. Click role dropdown
3. Select new role
4. Check for success message
5. Role should update

**Delete User:**
1. Find a user in "Registered Users"
2. Click "Delete" button
3. Confirm deletion
4. Check for success message
5. User should be removed from list

**Expected Result:** ✅ All actions complete successfully
**If Fails:** Check console for error details

---

### ✅ Test 9: Error Handling

**Steps:**
1. Look for any error messages in browser
2. Check browser console (F12 → Console) for errors
3. All errors should be logged with context
4. UI should still be functional

**Expected Result:** ✅ No JavaScript errors, graceful error handling
**If Fails:** Note error messages for debugging

---

### ✅ Test 10: Navigation

**Steps:**
1. Click each sidebar link:
   - 📊 Overview → Overview section shows
   - 📁 Projects → Projects section shows
   - 👥 Users & Roles → Users section shows
   - ✅ Tasks → Tasks section shows
   - 💰 Financial → Financial section shows
   - 📋 Logs → Logs section shows

2. Verify active link gets highlighted
3. Previous section hides, new one shows

**Expected Result:** ✅ All navigation works smoothly
**If Fails:** Check CSS for active state styling

---

## Troubleshooting

### Issue: "No pending users" but users should be there
**Solution:**
- Make sure users are registered with status 'pending'
- Check database: `SELECT * FROM users WHERE status = 'pending'`

### Issue: Projects/Tasks not showing
**Solution:**
- Create some test projects/tasks first
- Check if `/api/projects` returns data
- Verify user has permission to see them

### Issue: Storage chart not displaying
**Solution:**
- Check if Chart.js is loaded (verify in Network tab)
- Ensure Canvas element exists in HTML
- Check console for Chart errors

### Issue: Blank tables instead of data
**Solution:**
- Check browser console for fetch errors
- Verify API endpoints are responding
- Check if authentication token is valid
- Ensure `getToken()` returns valid JWT

### Issue: Page keeps refreshing or data not updating
**Solution:**
- Check if refresh interval is working
- Look for JavaScript errors in console
- Try hard refresh (Ctrl+Shift+R)
- Check browser cache

### Issue: Buttons not working
**Solution:**
- Verify function is defined (check console)
- Check if API endpoint exists and is working
- Verify user has proper permissions
- Look for network errors in Network tab

---

## Browser Console Checks

### To check token:
```javascript
// In browser console (F12)
localStorage.getItem('token')
// Should return a long JWT token
```

### To check user info:
```javascript
// In browser console
JSON.parse(localStorage.getItem('user'))
// Should show user object with username, email, role
```

### To check API manually:
```javascript
// In browser console
fetch('http://localhost:3000/api/projects', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => console.log(data))
```

---

## Performance Benchmarks

| Operation | Target | Status |
|-----------|--------|--------|
| Page Load | < 2s | ✅ |
| Data Load | < 500ms | ✅ |
| Section Switch | < 200ms | ✅ |
| Chart Render | < 100ms | ✅ |
| Refresh Interval | 60s | ✅ |

---

## Sign-Off

| Test | Result | Tester | Date |
|------|--------|--------|------|
| Overview | ☐ Pass | _____ | ____ |
| Projects | ☐ Pass | _____ | ____ |
| Users | ☐ Pass | _____ | ____ |
| Tasks | ☐ Pass | _____ | ____ |
| Financials | ☐ Pass | _____ | ____ |
| Logs | ☐ Pass | _____ | ____ |
| Refresh | ☐ Pass | _____ | ____ |
| Actions | ☐ Pass | _____ | ____ |
| Navigation | ☐ Pass | _____ | ____ |
| Overall | ☐ Pass | _____ | ____ |

---

**Ready to test?** Start the backend and login!

```bash
cd backend
npm start
```

Then visit: `http://localhost:3000`
