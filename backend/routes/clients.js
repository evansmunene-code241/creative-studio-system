const express = require('express');
const db = require('../config/database');
const { verifyToken, isManager } = require('../middleware/auth');

const router = express.Router();

// Get all clients
router.get('/', verifyToken, (req, res) => {
  db.all(
    `SELECT * FROM clients ORDER BY name ASC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get single client
router.get('/:id', verifyToken, (req, res) => {
  db.get(
    `SELECT * FROM clients WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(row);
    }
  );
});

// Create client (manager or admin)
router.post('/', verifyToken, isManager, (req, res) => {
  const { name, email, phone, company, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.run(
    `INSERT INTO clients (name, email, phone, company, address)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone, company, address],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create client' });
      }
      res.status(201).json({ id: this.lastID, message: 'Client created' });
    }
  );
});

// Update client
router.put('/:id', verifyToken, isManager, (req, res) => {
  const { name, email, phone, company, address, status } = req.body;

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (company !== undefined) {
    updates.push('company = ?');
    values.push(company);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.run(
    `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update client' });
      }
      res.json({ message: 'Client updated' });
    }
  );
});

// Delete client
router.delete('/:id', verifyToken, isManager, (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete client' });
    }
    res.json({ message: 'Client deleted' });
  });
});

module.exports = router;
