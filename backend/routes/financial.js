const express = require('express');
const db = require('../config/database');
const { verifyToken, isManager } = require('../middleware/auth');

const router = express.Router();

// Get financial dashboard summary
router.get('/dashboard', verifyToken, isManager, (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || null;

  let dateCondition = `strftime('%Y', issueDate) = ?`;
  let dateValue = year.toString();

  if (month) {
    dateCondition = `strftime('%Y-%m', issueDate) = ?`;
    dateValue = `${year}-${String(month).padStart(2, '0')}`;
  }

  // Get summary data
  const invoiceDateCondition = dateCondition.replace('issueDate', 'issueDate');
  const expenseDateCondition = dateCondition.replace('issueDate', 'expenseDate');
  
  db.all(
    `SELECT 
       (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE ${invoiceDateCondition}) as totalInvoiced,
       (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'paid' AND ${invoiceDateCondition}) as totalPaid,
       (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('draft', 'sent') AND ${invoiceDateCondition}) as totalPending,
       (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'overdue' AND ${invoiceDateCondition}) as totalOverdue,
       (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE ${expenseDateCondition}) as totalExpenses`,
    [dateValue, dateValue, dateValue, dateValue, dateValue],
    (err, rows) => {
      if (err) {
        console.error('Financial dashboard error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const summary = rows[0] || {};

      // Calculate profit
      const revenue = (summary.totalInvoiced || 0);
      const expenses = (summary.totalExpenses || 0);
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

      res.json({
        period: month ? `${year}-${month}` : year,
        summary: {
          totalInvoiced: summary.totalInvoiced || 0,
          totalPaid: summary.totalPaid || 0,
          totalPending: summary.totalPending || 0,
          totalOverdue: summary.totalOverdue || 0,
          totalExpenses: summary.totalExpenses || 0,
          revenue: revenue,
          expenses: expenses,
          profit: profit,
          profitMargin: profitMargin + '%'
        }
      });
    }
  );
});

// Get monthly revenue breakdown
router.get('/revenue', verifyToken, isManager, (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  db.all(
    `SELECT 
       strftime('%m', issueDate) as month,
       COALESCE(SUM(amount), 0) as amount,
       COUNT(*) as count
     FROM invoices
     WHERE strftime('%Y', issueDate) = ?
     GROUP BY strftime('%m', issueDate)
     ORDER BY month ASC`,
    [year.toString()],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = rows.map(r => ({
        month: monthNames[parseInt(r.month) - 1],
        revenue: r.amount,
        invoices: r.count
      }));

      res.json(data);
    }
  );
});

// Get expense breakdown by category
router.get('/expenses/breakdown', verifyToken, isManager, (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  db.all(
    `SELECT 
       category,
       COALESCE(SUM(amount), 0) as amount,
       COUNT(*) as count
     FROM expenses
     WHERE strftime('%Y', expenseDate) = ?
     GROUP BY category
     ORDER BY amount DESC`,
    [year.toString()],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(rows || []);
    }
  );
});

// Get project profitability
router.get('/projects/profitability', verifyToken, isManager, (req, res) => {
  db.all(
    `SELECT 
       p.id,
       p.name,
       COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as revenue,
       COALESCE(SUM(e.amount), 0) as expenses,
       COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) - 
       COALESCE(SUM(e.amount), 0) as profit
     FROM projects p
     LEFT JOIN invoices i ON p.id = i.projectId
     LEFT JOIN expenses e ON p.id = e.projectId
     GROUP BY p.id, p.name
     ORDER BY profit DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const data = (rows || []).map(r => ({
        projectId: r.id,
        projectName: r.name,
        revenue: r.revenue || 0,
        expenses: r.expenses || 0,
        profit: r.profit || 0,
        profitMargin: r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(2) : 0
      }));

      res.json(data);
    }
  );
});

// Get invoice status breakdown
router.get('/invoices/status', verifyToken, isManager, (req, res) => {
  db.all(
    `SELECT 
       status,
       COUNT(*) as count,
       COALESCE(SUM(amount), 0) as total
     FROM invoices
     GROUP BY status
     ORDER BY COUNT(*) DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(rows || []);
    }
  );
});

// Get cash flow (paid vs pending)
router.get('/cashflow', verifyToken, isManager, (req, res) => {
  const months = 12;
  const today = new Date();
  const data = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const yearMonth = date.toISOString().substring(0, 7);

    db.all(
      `SELECT 
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid,
         COALESCE(SUM(CASE WHEN status != 'paid' THEN amount ELSE 0 END), 0) as pending
       FROM invoices
       WHERE strftime('%Y-%m', issueDate) = ?`,
      [yearMonth],
      (err, rows) => {
        if (rows && rows[0]) {
          data.push({
            month: yearMonth,
            paid: rows[0].paid || 0,
            pending: rows[0].pending || 0
          });
        }

        if (data.length === months) {
          res.json(data);
        }
      }
    );
  }
});

// Get client payment history
router.get('/clients/:clientId/history', verifyToken, (req, res) => {
  const clientId = req.params.clientId;

  db.all(
    `SELECT 
       invoiceNumber,
       amount,
       status,
       issueDate,
       dueDate,
       paidDate
     FROM invoices
     WHERE clientId = ?
     ORDER BY issueDate DESC`,
    [clientId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const summary = {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        invoices: rows || []
      };

      if (summary.invoices.length > 0) {
        summary.invoices.forEach(inv => {
          summary.total += inv.amount;
          if (inv.status === 'paid') {
            summary.paid += inv.amount;
          } else if (inv.status === 'overdue') {
            summary.overdue += inv.amount;
          } else {
            summary.pending += inv.amount;
          }
        });
      }

      res.json(summary);
    }
  );
});

// Get budget vs actual
router.get('/budget/vs/actual', verifyToken, isManager, (req, res) => {
  db.all(
    `SELECT 
       p.id,
       p.name,
       p.budget,
       COALESCE(SUM(e.amount), 0) as spent,
       p.budget - COALESCE(SUM(e.amount), 0) as remaining
     FROM projects p
     LEFT JOIN expenses e ON p.id = e.projectId
     GROUP BY p.id, p.name, p.budget
     ORDER BY p.budget DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const data = (rows || []).map(r => ({
        projectId: r.id,
        projectName: r.name,
        budget: r.budget || 0,
        spent: r.spent || 0,
        remaining: r.remaining || 0,
        percentUsed: r.budget > 0 ? ((r.spent / r.budget) * 100).toFixed(2) : 0
      }));

      res.json(data);
    }
  );
});

// Generate financial report
router.post('/reports/generate', verifyToken, isManager, (req, res) => {
  const { reportType, startDate, endDate, period } = req.body;
  const userId = req.user.id;

  if (!reportType) {
    return res.status(400).json({ error: 'Report type is required' });
  }

  // Fetch data for report
  let dateFilter = '';
  let params = [];

  if (startDate && endDate) {
    dateFilter = ` WHERE (i.issueDate BETWEEN ? AND ? OR e.expenseDate BETWEEN ? AND ?)`;
    params = [startDate, endDate, startDate, endDate];
  }

  db.get(
    `SELECT 
       COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as totalRevenue,
       COALESCE(SUM(e.amount), 0) as totalExpenses,
       COUNT(DISTINCT i.projectId) as projectCount,
       COUNT(DISTINCT i.clientId) as clientCount
     FROM invoices i
     FULL OUTER JOIN expenses e ON 1=1
     ${dateFilter}`,
    params,
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const reportData = row || {};
      const revenue = reportData.totalRevenue || 0;
      const expenses = reportData.totalExpenses || 0;
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
        taxAmount: (profit * 0.1).toFixed(2), // 10% tax estimate
        projectCount: reportData.projectCount || 0,
        clientCount: reportData.clientCount || 0,
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
});

// Get all financial reports
router.get('/reports', verifyToken, isManager, (req, res) => {
  db.all(
    `SELECT * FROM financialReports
     ORDER BY createdAt DESC
     LIMIT 100`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get report by ID
router.get('/reports/:id', verifyToken, isManager, (req, res) => {
  const reportId = req.params.id;

  db.get(
    `SELECT * FROM financialReports WHERE id = ?`,
    [reportId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(row);
    }
  );
});

// Create budget for project
router.post('/budgets', verifyToken, isManager, (req, res) => {
  const { projectId, budgetAmount, category, status } = req.body;

  if (!projectId || !budgetAmount) {
    return res.status(400).json({ error: 'Project ID and budget amount are required' });
  }

  db.run(
    `INSERT INTO budgets (projectId, budgetAmount, category, status)
     VALUES (?, ?, ?, ?)`,
    [projectId, budgetAmount, category || 'general', status || 'active'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create budget' });
      }
      res.status(201).json({ id: this.lastID, message: 'Budget created' });
    }
  );
});

// Get budgets for project
router.get('/budgets/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT b.*, COALESCE(SUM(e.amount), 0) as spent
     FROM budgets b
     LEFT JOIN expenses e ON b.projectId = e.projectId AND b.category = e.category
     WHERE b.projectId = ?
     GROUP BY b.id
     ORDER BY b.createdAt DESC`,
    [projectId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const data = (rows || []).map(r => ({
        ...r,
        remaining: r.budgetAmount - r.spent,
        percentUsed: r.budgetAmount > 0 ? ((r.spent / r.budgetAmount) * 100).toFixed(2) : 0
      }));

      res.json(data);
    }
  );
});

// Get all active budgets
router.get('/budgets', verifyToken, isManager, (req, res) => {
  db.all(
    `SELECT b.*, p.name as projectName, COALESCE(SUM(e.amount), 0) as spent
     FROM budgets b
     LEFT JOIN projects p ON b.projectId = p.id
     LEFT JOIN expenses e ON b.projectId = e.projectId AND b.category = e.category
     WHERE b.status = 'active'
     GROUP BY b.id
     ORDER BY b.createdAt DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const data = (rows || []).map(r => ({
        ...r,
        remaining: r.budgetAmount - r.spent,
        percentUsed: r.budgetAmount > 0 ? ((r.spent / r.budgetAmount) * 100).toFixed(2) : 0
      }));

      res.json(data);
    }
  );
});

// Update budget
router.put('/budgets/:id', verifyToken, isManager, (req, res) => {
  const budgetId = req.params.id;
  const { budgetAmount, category, status } = req.body;

  const updates = [];
  const values = [];

  if (budgetAmount !== undefined) {
    updates.push('budgetAmount = ?');
    values.push(budgetAmount);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    values.push(category);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(budgetId);

  if (updates.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  db.run(
    `UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update budget' });
      }
      res.json({ message: 'Budget updated' });
    }
  );
});

module.exports = router;
