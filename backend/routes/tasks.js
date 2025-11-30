const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all tasks (admin only) or user's tasks
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let query = `
    SELECT t.*, 
           u.username as assignedToName,
           p.name as projectName
    FROM tasks t
    LEFT JOIN users u ON t.assignedTo = u.id
    LEFT JOIN projects p ON t.projectId = p.id
  `;

  if (role !== 'admin') {
    query += ` WHERE t.assignedTo = ? OR p.createdBy = ?`;
  }

  query += ` ORDER BY t.priority DESC, t.dueDate ASC`;

  const params = role !== 'admin' ? [userId, userId] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error loading tasks:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Get tasks for a project
router.get('/project/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user.id;

  // Check project access
  db.get('SELECT assignedTo, createdBy FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.assignedTo !== userId && project.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.all(
      `SELECT t.*, u.username as assignedToName 
       FROM tasks t
       LEFT JOIN users u ON t.assignedTo = u.id
       WHERE t.projectId = ?
       ORDER BY t.priority DESC, t.dueDate ASC`,
      [projectId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
      }
    );
  });
});

// Get task by ID
router.get('/:id', verifyToken, (req, res) => {
  const taskId = req.params.id;

  db.get(
    `SELECT t.*, u.username as assignedToName, p.name as projectName
     FROM tasks t
     LEFT JOIN users u ON t.assignedTo = u.id
     LEFT JOIN projects p ON t.projectId = p.id
     WHERE t.id = ?`,
    [taskId],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    }
  );
});

// Create task
router.post('/', verifyToken, (req, res) => {
  const { projectId, title, description, priority, assignedTo, dueDate, estimatedHours } = req.body;

  if (!projectId || !title) {
    return res.status(400).json({ error: 'ProjectId and title are required' });
  }

  // Check project access
  db.get('SELECT createdBy, assignedTo FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.createdBy !== req.user.id && project.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run(
      `INSERT INTO tasks (projectId, title, description, priority, assignedTo, dueDate, estimatedHours)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, title, description, priority || 'medium', assignedTo, dueDate, estimatedHours],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create task' });
        }
        res.status(201).json({ id: this.lastID, message: 'Task created' });
      }
    );
  });
});

// Update task
router.put('/:id', verifyToken, (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, assignedTo, dueDate, estimatedHours } = req.body;

  db.get('SELECT projectId FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'completed') {
        updates.push('completedAt = CURRENT_TIMESTAMP');
      }
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (assignedTo !== undefined) {
      updates.push('assignedTo = ?');
      values.push(assignedTo);
    }
    if (dueDate !== undefined) {
      updates.push('dueDate = ?');
      values.push(dueDate);
    }
    if (estimatedHours !== undefined) {
      updates.push('estimatedHours = ?');
      values.push(estimatedHours);
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(taskId);

    db.run(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values,
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update task' });
        }
        res.json({ message: 'Task updated' });
      }
    );
  });
});

// Delete task
router.delete('/:id', verifyToken, (req, res) => {
  const taskId = req.params.id;

  db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete task' });
    }
    res.json({ message: 'Task deleted' });
  });
});

// Get kanban board (grouped by status)
router.get('/kanban/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT t.*, u.username as assignedToName
     FROM tasks t
     LEFT JOIN users u ON t.assignedTo = u.id
     WHERE t.projectId = ?
     ORDER BY t.status, t.priority DESC, t.dueDate ASC`,
    [projectId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Group by status
      const kanban = {
        'todo': [],
        'in-progress': [],
        'review': [],
        'completed': []
      };

      rows.forEach(task => {
        if (kanban[task.status]) {
          kanban[task.status].push(task);
        }
      });

      res.json(kanban);
    }
  );
});

module.exports = router;
