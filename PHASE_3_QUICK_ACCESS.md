# Phase 3 - Quick Access Guide

## Access the Financial Dashboard

**URL:** `http://localhost:3000/financial`

**Requirements:**
- Must be logged in
- Must have Manager or Admin role
- Admin credentials: `liza@gmail.com` / `123456`

---

## Main Features

### 1. Overview Dashboard
- **Location:** Financial Dashboard → Overview tab
- **Shows:** Total revenue, paid, pending, expenses, profit
- **Charts:** Monthly revenue, expense breakdown, cash flow
- **Action:** Select month to view specific period metrics

### 2. Invoice Management
- **Location:** Financial Dashboard → Invoices tab
- **Actions:**
  - Create new invoice
  - Edit invoice details
  - Delete draft invoices
  - Track invoice status
  - View payment history
- **Statuses:** draft → sent → paid

### 3. Payment Tracking
- **Location:** Financial Dashboard → Payments tab
- **Actions:**
  - Record payment for invoice
  - Select payment method
  - Add confirmation number
  - View payment history
- **Methods:** Bank Transfer, Credit Card, Check, Cash

### 4. Expense Management
- **Location:** Financial Dashboard → Expenses tab
- **Actions:**
  - Record project expense
  - Categorize by type
  - Add vendor information
  - Track expense date
  - View expense history
- **Categories:** Software, Hardware, Labor, Marketing, Travel, Office, Other

### 5. Budget Tracking
- **Location:** Financial Dashboard → Budgets tab
- **Actions:**
  - Create project budget
  - Monitor spent vs budget
  - Track % utilization
  - Update budget amount
  - View remaining budget
- **Shows:** Budget → Spent → Remaining → % Used

### 6. Financial Reports
- **Location:** Financial Dashboard → Reports tab
- **Actions:**
  - Generate new report
  - Select report type
  - Choose date range
  - View report details
  - Download report (future)
- **Types:** Revenue, Expense, P&L, Cash Flow, Tax

---

## Key API Endpoints

### Invoices
```
GET    /api/invoices              # List invoices
POST   /api/invoices              # Create invoice
PUT    /api/invoices/:id          # Update invoice
DELETE /api/invoices/:id          # Delete invoice
```

### Payments
```
GET    /api/payments              # List payments
POST   /api/payments              # Record payment
PUT    /api/payments/:id          # Update payment
DELETE /api/payments/:id          # Delete payment
```

### Expenses
```
GET    /api/expenses              # List expenses
POST   /api/expenses              # Record expense
PUT    /api/expenses/:id          # Update expense
DELETE /api/expenses/:id          # Delete expense
```

### Budgets
```
GET    /api/financial/budgets     # List budgets
POST   /api/financial/budgets     # Create budget
PUT    /api/financial/budgets/:id # Update budget
```

### Reports
```
GET    /api/financial/reports     # List reports
POST   /api/financial/reports/generate  # Generate report
GET    /api/financial/dashboard   # Get dashboard data
```

---

## Test Scenarios

### Quick Test 1: Create Invoice
1. Go to `/financial` → Invoices
2. Click "Create Invoice"
3. Select a client
4. Enter amount: $5000
5. Set dates
6. Click "Create Invoice"
7. Verify invoice appears in list

### Quick Test 2: Record Payment
1. Go to `/financial` → Payments
2. Click "Record Payment"
3. Select the invoice you just created
4. Enter amount: $5000
5. Select payment method: "Bank Transfer"
6. Enter payment date
7. Click "Record Payment"
8. Verify payment appears in list
9. Go back to Invoices → verify status changed to "paid"

### Quick Test 3: Track Expense
1. Go to `/financial` → Expenses
2. Click "Record Expense"
3. Select a project
4. Select category: "Software"
5. Enter amount: $500
6. Enter vendor: "Adobe"
7. Click "Record Expense"
8. Verify expense appears in list

### Quick Test 4: Create Budget
1. Go to `/financial` → Budgets
2. Click "Create Budget"
3. Select a project
4. Enter budget amount: $10000
5. Click "Create Budget"
6. Verify budget appears in list
7. Add expenses to project
8. Watch % used update in real-time

### Quick Test 5: Generate Report
1. Go to `/financial` → Reports
2. Click "Generate Report"
3. Select type: "Revenue Report"
4. Select period: "Monthly"
5. Set start/end dates
6. Click "Generate Report"
7. Verify report appears in list with calculations

### Quick Test 6: View Dashboard
1. Go to `/financial` → Overview
2. Select a month
3. Verify metrics display:
   - Total Revenue
   - Total Paid
   - Pending Payment
   - Total Expenses
   - Profit Summary
4. Check charts render correctly
5. Verify profit margin calculated

---

## File Locations

### Backend Files
```
backend/
├── routes/
│   ├── invoices.js        # Invoice endpoints
│   ├── payments.js        # Payment endpoints
│   ├── expenses.js        # Expense endpoints
│   └── financial.js       # Reports & budgets
├── config/
│   └── database.js        # Database & tables
└── server.js              # Routes registration
```

### Frontend Files
```
frontend/
├── financial_dashboard.html       # Main UI
├── css/
│   └── financial.css              # Styling (1500+ lines)
└── js/
    └── financial.js               # Logic (600+ lines)
```

---

## Important Notes

### Role Requirements
- **Admin/Manager:** Full access to all features
- **Team Member:** Can only see their own expenses
- **Client:** No access (use Client Portal instead)
- **Guest:** No access

### Data Validation
- Amounts must be positive numbers
- Dates are validated
- Client ID required for invoices
- Project ID required for expenses and budgets
- Invoice can only be deleted if status is "draft"

### Calculations
- **Profit** = Revenue - Expenses
- **Profit Margin** = (Profit / Revenue) × 100%
- **Budget Utilization** = (Spent / Budget) × 100%
- **Tax** = Profit × 10% (estimated)

### Status Meanings

**Invoice Status:**
- `draft` - Created but not sent
- `sent` - Sent to client
- `paid` - Payment received
- `overdue` - Past due date

**Payment Status:**
- `pending` - Recorded but not processed
- `completed` - Payment confirmed

**Budget Status:**
- `active` - Currently tracking
- `inactive` - Archived or closed

---

## Troubleshooting

### Can't access Financial Dashboard
- Check if you're logged in
- Verify you have Admin or Manager role
- Check browser console for errors

### Charts not displaying
- Wait for data to load
- Check if there's data for the selected period
- Try refreshing the page

### Payment not updating invoice status
- Verify the payment amount equals invoice amount
- Check if invoice status is "sent"
- Try refreshing the invoice list

### Budget calculation seems wrong
- Verify expenses are associated with correct project
- Check expense categories match budget categories
- Try refreshing the page

---

## Next Steps

After Phase 3, Phase 4 will add:
- Email notifications for invoices
- Payment gateway integration
- Invoice template customization
- Recurring invoices
- Financial forecasting
- Advanced reporting exports
- Multi-currency support

---

## Support Documentation

For detailed information, see:
- `PHASE_3_IMPLEMENTATION.md` - Complete feature docs
- `IMPLEMENTATION_STATUS.md` - Project status
- Backend route files for API details
- Frontend JS file for data flow
