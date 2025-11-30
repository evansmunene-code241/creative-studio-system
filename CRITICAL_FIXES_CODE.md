# Critical Fixes - Code Solutions

**Priority:** MUST FIX TODAY  
**Date:** November 30, 2025  
**Estimated Time:** 30 minutes for all three fixes

---

## FIX #1: Static Files Path Error

### Location
File: `backend/server.js` (Line 73)

### Current Code (BROKEN)
```javascript
// Serve static files (CSS, JS, images)
app.use(express.static('../frontend'));
```

### Problem
- Uses relative path `../frontend`
- May fail depending on where Node process starts
- Frontend assets (CSS, JS, images) won't load
- Browser will show blank page with 404 errors

### Fixed Code
```javascript
// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend')));
```

### Complete Fixed Section (Lines 1-75)
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');
const config = require('./config/env');

// Create necessary directories
const dirs = ['./uploads', './backups'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes MUST come before static files
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/backups', require('./routes/backups'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve frontend (basic routing)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin_dashboard.html'));
});

app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/client_portal.html'));
});

app.get('/financial', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/financial_dashboard.html'));
});

// Serve static files (CSS, JS, images) - FIXED HERE
app.use(express.static(path.join(__dirname, '../frontend')));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/files/upload');
  console.log('  GET /api/files/list');
  console.log('  GET /api/files/download/:id');
  console.log('  DELETE /api/files/:id');
  console.log('  GET /api/backups/history');
  console.log('  POST /api/backups/file/:id');
  console.log('  GET /api/backups/admin/history');
  console.log('  GET /api/admin/pending-users');
  console.log('  POST /api/admin/approve-user');
  console.log('  POST /api/admin/reject-user');
  console.log('  GET /api/admin/all-users');
  console.log('  POST /api/admin/delete-user');
  console.log('  GET /api/admin/backup-logs');
  console.log('  GET /api/admin/audit-logs');
});
```

### How to Apply
1. Open `backend/server.js`
2. Find line 73: `app.use(express.static('../frontend'));`
3. Replace with: `app.use(express.static(path.join(__dirname, '../frontend')));`
4. Save file
5. Restart Node server
6. Test: Visit http://localhost:3000 - CSS and styling should load

### Verification
```bash
# In browser console, should see:
# ✓ CSS loaded (no 404 errors)
# ✓ Images displaying
# ✓ JavaScript executing properly
```

---

## FIX #2: Remove Duplicate Invoices Table

### Location
File: `backend/config/database.js`

### Problem
- Lines 151-170: First `invoices` table definition
- Lines 230-249: DUPLICATE `invoices` table definition
- SQLite ignores duplicates, but it's wasteful and confusing

### Current Code (BROKEN)
```javascript
// Lines 151-170
db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER,
    clientId INTEGER NOT NULL,
    invoiceNumber TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'draft',
    issueDate DATE,
    dueDate DATE,
    paidDate DATE,
    description TEXT,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id),
    FOREIGN KEY (clientId) REFERENCES clients(id)
  )
`);

// ... other tables ...

// Lines 230-249 - DUPLICATE! DELETE THIS ENTIRE SECTION
db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER,
    clientId INTEGER NOT NULL,
    invoiceNumber TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'draft',
    issueDate DATE,
    dueDate DATE,
    paidDate DATE,
    description TEXT,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id),
    FOREIGN KEY (clientId) REFERENCES clients(id)
  )
`);
```

### How to Apply
1. Open `backend/config/database.js`
2. Locate lines 230-249 (starts with `// Invoices table (Phase 3)`)
3. **DELETE the entire section** from line 230 to line 249
4. Keep lines 1-229 as-is
5. Adjust remaining line numbers accordingly
6. Save file

### What to Delete
```javascript
// DELETE THESE 20 LINES (230-249):

  // Invoices table (Phase 3)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER,
      clientId INTEGER NOT NULL,
      invoiceNumber TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      issueDate DATE,
      dueDate DATE,
      paidDate DATE,
      description TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);
```

### Verification
- File should end around line 322 (after Expenses and Payments tables)
- Only ONE invoices table definition should exist
- No errors on startup

---

## FIX #3: Fix FULL OUTER JOIN in Financial Route

### Location
File: `backend/routes/financial.js` (Line 314)

### Problem
- SQLite does **NOT** support `FULL OUTER JOIN`
- Query will crash with SQL error when financial reports are generated
- Affects: `POST /api/financial/reports/generate`

### Current Code (BROKEN)
```javascript
// Lines 307-315
db.get(
  `SELECT 
     COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as totalRevenue,
     COALESCE(SUM(e.amount), 0) as totalExpenses,
     COUNT(DISTINCT i.projectId) as projectCount,
     COUNT(DISTINCT i.clientId) as clientCount
   FROM invoices i
   FULL OUTER JOIN expenses e ON 1=1   // ← BROKEN! SQLite doesn't support this
   ${dateFilter}`,
  params,
  (err, row) => {
    // ...
  }
);
```

### Fixed Code (OPTION 1: Simplified with Subqueries)
```javascript
db.get(
  `SELECT 
     (SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) 
      FROM invoices ${dateFilter ? 'WHERE ' + dateFilter.replace('i.', '') : ''}) as totalRevenue,
     (SELECT COALESCE(SUM(amount), 0) 
      FROM expenses ${dateFilter ? 'WHERE ' + dateFilter.replace('e.', '') : ''}) as totalExpenses,
     (SELECT COUNT(DISTINCT projectId) FROM invoices) as projectCount,
     (SELECT COUNT(DISTINCT clientId) FROM invoices) as clientCount`,
  params,
  (err, row) => {
    // ... rest unchanged
  }
);
```

### Fixed Code (OPTION 2: Using Individual Queries - Recommended)
```javascript
// Fetch invoice data
db.get(
  `SELECT 
     COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalRevenue,
     COUNT(DISTINCT projectId) as projectCount,
     COUNT(DISTINCT clientId) as clientCount
   FROM invoices
   WHERE issueDate BETWEEN ? AND ?`,
  [startDate, endDate],
  (err, invoiceData) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Fetch expense data separately
    db.get(
      `SELECT COALESCE(SUM(amount), 0) as totalExpenses
       FROM expenses
       WHERE expenseDate BETWEEN ? AND ?`,
      [startDate, endDate],
      (err, expenseData) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const reportData = {
          totalRevenue: invoiceData.totalRevenue || 0,
          totalExpenses: expenseData.totalExpenses || 0,
          projectCount: invoiceData.projectCount || 0,
          clientCount: invoiceData.clientCount || 0
        };

        const revenue = reportData.totalRevenue;
        const expenses = reportData.totalExpenses;
        const profit = revenue - expenses;

        const reportInfo = {
          reportType,
          period: period || 'custom',
          startDate,
          endDate,
          totalRevenue: revenue,
          totalExpenses: expenses,
          profit: profit,
          profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0,
          taxAmount: (profit * 0.1).toFixed(2),
          projectCount: reportData.projectCount,
          clientCount: reportData.clientCount,
          data: JSON.stringify(reportData)
        };

        db.run(
          `INSERT INTO financialReports (reportType, period, startDate, endDate, totalRevenue, totalExpenses, profit, taxAmount, projectCount, clientCount, data, createdBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [reportInfo.reportType, reportInfo.period, startDate, endDate, revenue, expenses, profit, reportInfo.taxAmount, reportInfo.projectCount, reportInfo.clientCount, reportInfo.data, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to generate report' });
            }
            res.status(201).json({
              id: this.lastID,
              ...reportInfo,
              message: 'Financial report generated'
            });
          }
        );
      }
    );
  }
);
```

### How to Apply
1. Open `backend/routes/financial.js`
2. Find the `POST /reports/generate` route (around line 290)
3. Locate the problematic `db.get()` call (around line 307-315)
4. Replace the entire db.get() call with Option 2 above
5. Save file
6. Test: Try creating a financial report

### Verification
```bash
# Test endpoint:
curl -X POST http://localhost:3000/api/financial/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reportType": "profit_loss",
    "period": "month",
    "startDate": "2025-01-01",
    "endDate": "2025-11-30"
  }'

# Should return:
# {
#   "id": 1,
#   "reportType": "profit_loss",
#   "totalRevenue": 10000,
#   "totalExpenses": 2000,
#   "profit": 8000,
#   "message": "Financial report generated"
# }
```

---

## Testing Checklist

### After Applying All Three Fixes

- [ ] **Fix #1 Test:**
  - [ ] Visit http://localhost:3000
  - [ ] Page loads with styling (not blank)
  - [ ] All CSS visible
  - [ ] No 404 errors in console
  - [ ] Images load properly

- [ ] **Fix #2 Test:**
  - [ ] Server starts without warnings
  - [ ] No duplicate table errors
  - [ ] Invoice endpoints work
  - [ ] Database queries execute normally

- [ ] **Fix #3 Test:**
  - [ ] Financial dashboard loads
  - [ ] Create financial report (POST /api/financial/reports/generate)
  - [ ] Report displays correct data
  - [ ] No SQL errors in console

### Full System Verification
- [ ] Login works
- [ ] Dashboard loads
- [ ] Admin dashboard accessible
- [ ] Financial dashboard functional
- [ ] Create invoice - works
- [ ] Record payment - works
- [ ] Generate report - works (CRITICAL)

---

## Summary of Changes

| Fix | File | Lines | Change | Impact |
|-----|------|-------|--------|--------|
| #1 | server.js | 73 | Path fix | Frontend loads |
| #2 | database.js | 230-249 | Delete duplicate | DB cleanup |
| #3 | financial.js | 307-315 | SQL query fix | Reports work |

**Total Time:** ~30 minutes  
**Risk Level:** Low (changes isolated)  
**Testing Time:** ~10 minutes

---

## Next Steps After Fixes

1. Commit changes to version control
2. Test full workflow
3. Check error logs
4. Proceed with High Priority issues

See `ERRORS_AND_ISSUES_REPORT.md` for remaining issues to fix.
