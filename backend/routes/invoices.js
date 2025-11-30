const express = require('express');
const db = require('../config/database');
const { verifyToken, isManager } = require('../middleware/auth');

const router = express.Router();

// Get all invoices (filtered by role)
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let query = `
    SELECT i.*, c.name as clientName, p.name as projectName
    FROM invoices i
    LEFT JOIN clients c ON i.clientId = c.id
    LEFT JOIN projects p ON i.projectId = p.id
  `;

  let params = [];

  // Clients only see their invoices
  if (role === 'client') {
    query += ` WHERE i.clientId IN (SELECT id FROM clients WHERE id IN 
      (SELECT clientId FROM projects WHERE assignedTo = ?))`;
    params = [userId];
  }

  query += ` ORDER BY i.issueDate DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Get invoice by ID
router.get('/:id', verifyToken, (req, res) => {
  const invoiceId = req.params.id;

  db.get(
    `SELECT i.*, c.name as clientName, p.name as projectName
     FROM invoices i
     LEFT JOIN clients c ON i.clientId = c.id
     LEFT JOIN projects p ON i.projectId = p.id
     WHERE i.id = ?`,
    [invoiceId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json(row);
    }
  );
});

// Create invoice
router.post('/', verifyToken, isManager, (req, res) => {
  const { projectId, clientId, amount, description, notes, issueDate, dueDate } = req.body;

  if (!clientId || !amount) {
    return res.status(400).json({ error: 'Client ID and amount are required' });
  }

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;

  db.run(
    `INSERT INTO invoices (projectId, clientId, invoiceNumber, amount, description, notes, issueDate, dueDate, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [projectId, clientId, invoiceNumber, amount, description, notes, issueDate, dueDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create invoice' });
      }
      res.status(201).json({ id: this.lastID, invoiceNumber, message: 'Invoice created' });
    }
  );
});

// Update invoice
router.put('/:id', verifyToken, isManager, (req, res) => {
  const invoiceId = req.params.id;
  const { amount, description, notes, status, dueDate, paidDate } = req.body;

  const updates = [];
  const values = [];

  if (amount !== undefined) {
    updates.push('amount = ?');
    values.push(amount);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (dueDate !== undefined) {
    updates.push('dueDate = ?');
    values.push(dueDate);
  }
  if (paidDate !== undefined) {
    updates.push('paidDate = ?');
    values.push(paidDate);
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(invoiceId);

  if (updates.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  db.run(
    `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update invoice' });
      }
      res.json({ message: 'Invoice updated' });
    }
  );
});

// Send invoice to client
router.put('/:id/send', verifyToken, isManager, (req, res) => {
  const invoiceId = req.params.id;

  db.run(
    `UPDATE invoices SET status = 'sent', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [invoiceId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to send invoice' });
      }
      res.json({ message: 'Invoice sent to client' });
    }
  );
});

// Record payment
router.put('/:id/pay', verifyToken, isManager, (req, res) => {
  const invoiceId = req.params.id;
  const { amount, paymentDate } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  db.run(
    `UPDATE invoices 
     SET status = 'paid', paidDate = ?, updatedAt = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [paymentDate || new Date().toISOString(), invoiceId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to record payment' });
      }
      res.json({ message: 'Payment recorded' });
    }
  );
});

// Delete invoice
router.delete('/:id', verifyToken, isManager, (req, res) => {
  const invoiceId = req.params.id;

  db.get('SELECT status FROM invoices WHERE id = ?', [invoiceId], (err, invoice) => {
    if (err || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot delete paid invoices' });
    }

    db.run('DELETE FROM invoices WHERE id = ?', [invoiceId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete invoice' });
      }
      res.json({ message: 'Invoice deleted' });
    });
  });
});

// Get invoices by client
router.get('/client/:clientId', verifyToken, (req, res) => {
  const clientId = req.params.clientId;

  db.all(
    `SELECT i.*, p.name as projectName
     FROM invoices i
     LEFT JOIN projects p ON i.projectId = p.id
     WHERE i.clientId = ?
     ORDER BY i.issueDate DESC`,
    [clientId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get invoices by project
router.get('/project/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT i.*, c.name as clientName
     FROM invoices i
     LEFT JOIN clients c ON i.clientId = c.id
     WHERE i.projectId = ?
     ORDER BY i.issueDate DESC`,
    [projectId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

module.exports = router;
