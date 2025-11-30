const express = require('express');
const db = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all projects (admin) or user's projects
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let query = `
    SELECT p.*, 
           c.name as clientName,
           u.username as assignedToName,
           COUNT(DISTINCT t.id) as totalTasks,
           SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTasks
    FROM projects p
    LEFT JOIN clients c ON p.clientId = c.id
    LEFT JOIN users u ON p.assignedTo = u.id
    LEFT JOIN tasks t ON p.id = t.projectId
  `;

  if (role !== 'admin') {
    query += ` WHERE p.assignedTo = ? OR p.createdBy = ?`;
  }

  query += ` GROUP BY p.id ORDER BY p.createdAt DESC`;

  const params = role !== 'admin' ? [userId, userId] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get single project
router.get('/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT p.*, c.name as clientName, u.username as assignedToName
     FROM projects p
     LEFT JOIN clients c ON p.clientId = c.id
     LEFT JOIN users u ON p.assignedTo = u.id
     WHERE p.id = ?`,
    [projectId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check access
      if (req.user.role !== 'admin' && project.assignedTo !== userId && project.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(project);
    }
  );
});

// Create project (admin or manager)
router.post('/', verifyToken, (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only admin/manager can create projects' });
  }

  const { clientId, name, description, priority, startDate, deadline, budget, assignedTo } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  db.run(
    `INSERT INTO projects (clientId, name, description, priority, startDate, deadline, budget, assignedTo, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [clientId, name, description, priority || 'medium', startDate, deadline, budget || 0, assignedTo, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create project' });
      }
      res.status(201).json({ id: this.lastID, message: 'Project created' });
    }
  );
});

// Update project
router.put('/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;
  const { name, description, status, priority, deadline, budget, assignedTo, progress } = req.body;

  // Check access
  db.get('SELECT createdBy, assignedTo FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.createdBy !== req.user.id && project.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(deadline);
    }
    if (budget !== undefined) {
      updates.push('budget = ?');
      values.push(budget);
    }
    if (assignedTo !== undefined) {
      updates.push('assignedTo = ?');
      values.push(assignedTo);
    }
    if (progress !== undefined) {
      updates.push('progress = ?');
      values.push(progress);
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(projectId);

    db.run(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      values,
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update project' });
        }
        res.json({ message: 'Project updated' });
      }
    );
  });
});

// Delete project (admin or creator)
router.delete('/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;

  db.get('SELECT createdBy FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run('DELETE FROM projects WHERE id = ?', [projectId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete project' });
      }
      res.json({ message: 'Project deleted' });
    });
  });
});

module.exports = router;
