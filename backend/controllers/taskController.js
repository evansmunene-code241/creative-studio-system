const db = require('../config/database');

const getProjectTasks = (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT t.*, u.username as assignedToName
     FROM tasks t
     LEFT JOIN users u ON t.assignedTo = u.id
     WHERE t.projectId = ?
     ORDER BY CASE t.status
       WHEN 'todo' THEN 1
       WHEN 'in-progress' THEN 2
       WHEN 'review' THEN 3
       WHEN 'completed' THEN 4
     END, t.dueDate ASC`,
    [projectId],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch tasks' });
      }
      res.json({ tasks: tasks || [] });
    }
  );
};

const createTask = (req, res) => {
  const { projectId, title, description, priority, assignedTo, dueDate, estimatedHours } = req.body;

  if (!projectId || !title) {
    return res.status(400).json({ error: 'Project ID and title required' });
  }

  db.run(
    `INSERT INTO tasks (projectId, title, description, priority, assignedTo, dueDate, estimatedHours)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [projectId, title, description || '', priority || 'medium', assignedTo || null, dueDate || null, estimatedHours || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create task' });
      }
      res.status(201).json({ message: 'Task created', taskId: this.lastID });
    }
  );
};

const updateTask = (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, assignedTo, dueDate, estimatedHours } = req.body;

  db.run(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assignedTo = ?, dueDate = ?, estimatedHours = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, description, status, priority, assignedTo, dueDate, estimatedHours, taskId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update task' });
      }
      res.json({ message: 'Task updated' });
    }
  );
};

const completeTask = (req, res) => {
  const taskId = req.params.id;

  db.run(
    `UPDATE tasks SET status = ?, completedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    ['completed', taskId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to complete task' });
      }
      res.json({ message: 'Task completed' });
    }
  );
};

const deleteTask = (req, res) => {
  const taskId = req.params.id;

  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete task' });
    }
    res.json({ message: 'Task deleted' });
  });
};

module.exports = { getProjectTasks, createTask, updateTask, completeTask, deleteTask };
