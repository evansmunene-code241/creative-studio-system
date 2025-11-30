const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get deliverables for a project
router.get('/project/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT d.*, p.name as projectName
     FROM deliverables d
     LEFT JOIN projects p ON d.projectId = p.id
     WHERE d.projectId = ?
     ORDER BY d.dueDate ASC`,
    [projectId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get all pending approvals for client
router.get('/pending', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT d.*, p.name as projectName, c.name as clientName
     FROM deliverables d
     LEFT JOIN projects p ON d.projectId = p.id
     LEFT JOIN clients c ON p.clientId = c.id
     WHERE d.status = 'pending' AND p.clientId = (
       SELECT id FROM clients WHERE id IN (
         SELECT clientId FROM projects WHERE id = d.projectId
       )
     )
     ORDER BY d.dueDate ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Create deliverable
router.post('/', verifyToken, (req, res) => {
  const { projectId, title, description, dueDate, expectedDeliveryDate } = req.body;

  if (!projectId || !title) {
    return res.status(400).json({ error: 'ProjectId and title are required' });
  }

  db.run(
    `INSERT INTO deliverables (projectId, title, description, dueDate, expectedDeliveryDate, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [projectId, title, description, dueDate, expectedDeliveryDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create deliverable' });
      }
      res.status(201).json({ id: this.lastID, message: 'Deliverable created' });
    }
  );
});

// Submit deliverable for approval
router.put('/:id/submit', verifyToken, (req, res) => {
  const deliverableId = req.params.id;
  const { submissionNotes } = req.body;

  db.run(
    `UPDATE deliverables 
     SET status = 'submitted', submissionDate = CURRENT_TIMESTAMP, submissionNotes = ?
     WHERE id = ?`,
    [submissionNotes, deliverableId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to submit deliverable' });
      }
      res.json({ message: 'Deliverable submitted for approval' });
    }
  );
});

// Approve deliverable (client)
router.put('/:id/approve', verifyToken, (req, res) => {
  const deliverableId = req.params.id;
  const { approvalNotes } = req.body;

  db.run(
    `UPDATE deliverables 
     SET status = 'approved', approvalDate = CURRENT_TIMESTAMP, approvalNotes = ?
     WHERE id = ?`,
    [approvalNotes, deliverableId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to approve deliverable' });
      }
      res.json({ message: 'Deliverable approved' });
    }
  );
});

// Reject deliverable (client)
router.put('/:id/reject', verifyToken, (req, res) => {
  const deliverableId = req.params.id;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  db.run(
    `UPDATE deliverables 
     SET status = 'rejected', rejectionDate = CURRENT_TIMESTAMP, rejectionReason = ?
     WHERE id = ?`,
    [rejectionReason, deliverableId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to reject deliverable' });
      }
      res.json({ message: 'Deliverable rejected' });
    }
  );
});

// Get deliverable details
router.get('/:id', verifyToken, (req, res) => {
  db.get(
    `SELECT d.*, p.name as projectName
     FROM deliverables d
     LEFT JOIN projects p ON d.projectId = p.id
     WHERE d.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Deliverable not found' });
      }
      res.json(row);
    }
  );
});

module.exports = router;
