const express = require('express');
const db = require('../config/database');
const { verifyToken, isManager } = require('../middleware/auth');

const router = express.Router();

// Get all expenses
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let query = `
    SELECT e.*, p.name as projectName, u.username as createdByName
    FROM expenses e
    LEFT JOIN projects p ON e.projectId = p.id
    LEFT JOIN users u ON e.createdBy = u.id
  `;

  if (role !== 'admin') {
    query += ` WHERE e.projectId IN (SELECT id FROM projects WHERE assignedTo = ? OR createdBy = ?)`;
  }

  query += ` ORDER BY e.expenseDate DESC`;

  const params = role !== 'admin' ? [userId, userId] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Get expense by ID
router.get('/:id', verifyToken, (req, res) => {
  const expenseId = req.params.id;

  db.get(
    `SELECT e.*, p.name as projectName, u.username as createdByName
     FROM expenses e
     LEFT JOIN projects p ON e.projectId = p.id
     LEFT JOIN users u ON e.createdBy = u.id
     WHERE e.id = ?`,
    [expenseId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(row);
    }
  );
});

// Create expense
router.post('/', verifyToken, isManager, (req, res) => {
  const { projectId, category, description, amount, expenseDate, vendor, notes, status } = req.body;
  const userId = req.user.id;

  if (!projectId || !category || !amount) {
    return res.status(400).json({ error: 'Project ID, category, and amount are required' });
  }

  db.run(
    `INSERT INTO expenses (projectId, category, description, amount, expenseDate, vendor, notes, status, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, category, description, amount, expenseDate, vendor, notes, status || 'recorded', userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create expense' });
      }
      res.status(201).json({ id: this.lastID, message: 'Expense recorded' });
    }
  );
});

// Update expense
router.put('/:id', verifyToken, isManager, (req, res) => {
  const expenseId = req.params.id;
  const { category, description, amount, expenseDate, vendor, notes, status } = req.body;

  const updates = [];
  const values = [];

  if (category !== undefined) {
    updates.push('category = ?');
    values.push(category);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (amount !== undefined) {
    updates.push('amount = ?');
    values.push(amount);
  }
  if (expenseDate !== undefined) {
    updates.push('expenseDate = ?');
    values.push(expenseDate);
  }
  if (vendor !== undefined) {
    updates.push('vendor = ?');
    values.push(vendor);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(expenseId);

  if (updates.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  db.run(
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update expense' });
      }
      res.json({ message: 'Expense updated' });
    }
  );
});

// Delete expense
router.delete('/:id', verifyToken, isManager, (req, res) => {
  const expenseId = req.params.id;

  db.run('DELETE FROM expenses WHERE id = ?', [expenseId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete expense' });
    }
    res.json({ message: 'Expense deleted' });
  });
});

// Get expenses by project
router.get('/project/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT e.*, u.username as createdByName
     FROM expenses e
     LEFT JOIN users u ON e.createdBy = u.id
     WHERE e.projectId = ?
     ORDER BY e.expenseDate DESC`,
    [projectId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get expenses by category
router.get('/category/:category', verifyToken, (req, res) => {
  const category = req.params.category;
  const userId = req.user.id;

  db.all(
    `SELECT e.*, p.name as projectName
     FROM expenses e
     LEFT JOIN projects p ON e.projectId = p.id
     WHERE e.category = ? AND e.projectId IN (
       SELECT id FROM projects WHERE assignedTo = ? OR createdBy = ?
     )
     ORDER BY e.expenseDate DESC`,
    [category, userId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

module.exports = router;
