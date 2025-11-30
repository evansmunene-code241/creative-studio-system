const db = require('../config/database');

const getProjects = (req, res) => {
  db.all(
    `SELECT p.*, c.name as clientName, u.username as assignedToName
     FROM projects p
     LEFT JOIN clients c ON p.clientId = c.id
     LEFT JOIN users u ON p.assignedTo = u.id
     ORDER BY p.deadline ASC`,
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.json({ projects: projects || [] });
    }
  );
};

const createProject = (req, res) => {
  const { clientId, name, description, status, priority, startDate, deadline, budget, assignedTo } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name required' });
  }

  db.run(
    `INSERT INTO projects (clientId, name, description, status, priority, startDate, deadline, budget, assignedTo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [clientId || null, name, description || '', status || 'planning', priority || 'medium', startDate || null, deadline || null, budget || null, assignedTo || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create project' });
      }
      res.status(201).json({ message: 'Project created', projectId: this.lastID });
    }
  );
};

const updateProject = (req, res) => {
  const projectId = req.params.id;
  const { name, description, status, priority, deadline, budget, progress, assignedTo } = req.body;

  db.run(
    `UPDATE projects SET name = ?, description = ?, status = ?, priority = ?, deadline = ?, budget = ?, progress = ?, assignedTo = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, description, status, priority, deadline, budget, progress, assignedTo, projectId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update project' });
      }
      res.json({ message: 'Project updated' });
    }
  );
};

const deleteProject = (req, res) => {
  const projectId = req.params.id;

  db.run('DELETE FROM projects WHERE id = ?', [projectId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete project' });
    }
    res.json({ message: 'Project deleted' });
  });
};

const getProjectStats = (req, res) => {
  db.all(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning
     FROM projects`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }
      res.json(stats[0] || {});
    }
  );
};

module.exports = { getProjects, createProject, updateProject, deleteProject, getProjectStats };
