const express = require('express');
const db = require('../config/database');
const { verifyToken, isManager } = require('../middleware/auth');

const router = express.Router();

// Get all payments
router.get('/', verifyToken, (req, res) => {
  const role = req.user.role;
  let query = `
    SELECT p.*, i.invoiceNumber, i.amount as invoiceAmount, c.name as clientName
    FROM payments p
    LEFT JOIN invoices i ON p.invoiceId = i.id
    LEFT JOIN clients c ON i.clientId = c.id
  `;

  if (role === 'client') {
    query += ` WHERE i.clientId IN (
      SELECT id FROM clients WHERE id IN (
        SELECT clientId FROM projects WHERE assignedTo = ?
      )
    )`;
  }

  query += ` ORDER BY p.paymentDate DESC LIMIT 100`;

  const params = role === 'client' ? [req.user.id] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Get payment by ID
router.get('/:id', verifyToken, (req, res) => {
  const paymentId = req.params.id;

  db.get(
    `SELECT p.*, i.invoiceNumber, i.amount as invoiceAmount, c.name as clientName
     FROM payments p
     LEFT JOIN invoices i ON p.invoiceId = i.id
     LEFT JOIN clients c ON i.clientId = c.id
     WHERE p.id = ?`,
    [paymentId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      res.json(row);
    }
  );
});

// Create payment (record payment for invoice)
router.post('/', verifyToken, isManager, (req, res) => {
  const { invoiceId, amount, paymentMethod, paymentDate, confirmationNumber, notes } = req.body;

  if (!invoiceId || !amount) {
    return res.status(400).json({ error: 'Invoice ID and amount are required' });
  }

  // Get invoice first
  db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId], (err, invoice) => {
    if (err || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Insert payment record
    db.run(
      `INSERT INTO payments (invoiceId, amount, paymentMethod, status, paymentDate, confirmationNumber, notes)
       VALUES (?, ?, ?, 'completed', ?, ?, ?)`,
      [invoiceId, amount, paymentMethod || 'bank_transfer', paymentDate || new Date().toISOString().split('T')[0], confirmationNumber, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to record payment' });
        }

        // Update invoice status if fully paid
        const totalPaid = amount;
        if (totalPaid >= invoice.amount) {
          db.run(
            'UPDATE invoices SET status = ?, paidDate = ? WHERE id = ?',
            ['paid', paymentDate || new Date().toISOString().split('T')[0], invoiceId],
            (err) => {
              if (err) {
                console.error('Failed to update invoice status:', err);
              }
            }
          );
        } else {
          // Update to partially paid status
          db.run(
            'UPDATE invoices SET status = ? WHERE id = ?',
            ['partial', invoiceId],
            (err) => {
              if (err) {
                console.error('Failed to update invoice status:', err);
              }
            }
          );
        }

        res.status(201).json({ id: this.lastID, message: 'Payment recorded successfully' });
      }
    );
  });
});

// Update payment
router.put('/:id', verifyToken, isManager, (req, res) => {
  const paymentId = req.params.id;
  const { amount, paymentMethod, status, paymentDate, confirmationNumber, notes } = req.body;

  const updates = [];
  const values = [];

  if (amount !== undefined) {
    updates.push('amount = ?');
    values.push(amount);
  }
  if (paymentMethod !== undefined) {
    updates.push('paymentMethod = ?');
    values.push(paymentMethod);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (paymentDate !== undefined) {
    updates.push('paymentDate = ?');
    values.push(paymentDate);
  }
  if (confirmationNumber !== undefined) {
    updates.push('confirmationNumber = ?');
    values.push(confirmationNumber);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(paymentId);

  if (updates.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  db.run(
    `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update payment' });
      }
      res.json({ message: 'Payment updated' });
    }
  );
});

// Delete payment
router.delete('/:id', verifyToken, isManager, (req, res) => {
  const paymentId = req.params.id;

  db.run('DELETE FROM payments WHERE id = ?', [paymentId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete payment' });
    }
    res.json({ message: 'Payment deleted' });
  });
});

// Get payments by invoice
router.get('/invoice/:invoiceId', verifyToken, (req, res) => {
  const invoiceId = req.params.invoiceId;

  db.all(
    `SELECT p.*
     FROM payments p
     WHERE p.invoiceId = ?
     ORDER BY p.paymentDate DESC`,
    [invoiceId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get payments by client
router.get('/client/:clientId', verifyToken, (req, res) => {
  const clientId = req.params.clientId;

  db.all(
    `SELECT p.*, i.invoiceNumber
     FROM payments p
     LEFT JOIN invoices i ON p.invoiceId = i.id
     WHERE i.clientId = ?
     ORDER BY p.paymentDate DESC`,
    [clientId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get payment summary by period
router.get('/summary/:period', verifyToken, isManager, (req, res) => {
  const period = req.params.period; // 'month', 'quarter', 'year'
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || null;

  let dateFilter = `strftime('%Y', p.paymentDate) = ?`;
  let params = [year.toString()];

  if (period === 'month' && month) {
    dateFilter = `strftime('%Y-%m', p.paymentDate) = ?`;
    params = [`${year}-${String(month).padStart(2, '0')}`];
  }

  db.all(
    `SELECT 
       COUNT(*) as paymentCount,
       COALESCE(SUM(amount), 0) as totalAmount,
       COUNT(DISTINCT invoiceId) as invoiceCount,
       status
     FROM payments
     WHERE ${dateFilter}
     GROUP BY status
     ORDER BY totalAmount DESC`,
    params,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const summary = {
        period: month ? `${year}-${month}` : year,
        totalPayments: 0,
        totalAmount: 0,
        byStatus: {}
      };

      (rows || []).forEach(row => {
        summary.totalPayments += row.paymentCount;
        summary.totalAmount += row.totalAmount;
        summary.byStatus[row.status] = {
          count: row.paymentCount,
          amount: row.totalAmount
        };
      });

      res.json(summary);
    }
  );
});

module.exports = router;
