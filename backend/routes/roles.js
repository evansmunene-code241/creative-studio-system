const express = require('express');
const db = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users with roles (admin only)
router.get('/users', verifyToken, isAdmin, (req, res) => {
  db.all(
    `SELECT id, username, email, role, status, createdAt FROM users ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get available roles
router.get('/list', verifyToken, isAdmin, (req, res) => {
  const roles = [
    { id: 'admin', name: 'Administrator', permissions: ['manage-all', 'manage-users', 'manage-projects', 'view-reports'] },
    { id: 'manager', name: 'Project Manager', permissions: ['manage-projects', 'manage-team', 'view-reports', 'assign-tasks'] },
    { id: 'team-member', name: 'Team Member', permissions: ['view-projects', 'update-tasks', 'view-reports'] },
    { id: 'client', name: 'Client', permissions: ['view-projects', 'comment', 'approve-deliverables'] },
    { id: 'guest', name: 'Guest', permissions: ['view-projects', 'comment'] }
  ];
  res.json(roles);
});

// Update user role (admin only)
router.put('/assign/:userId', verifyToken, isAdmin, (req, res) => {
  const userId = req.params.userId;
  const { role } = req.body;

  const validRoles = ['admin', 'manager', 'team-member', 'client', 'guest'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Prevent removing last admin
  if (role !== 'admin') {
    db.get(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != ?",
      [userId],
      (err, result) => {
        if (result.count === 0) {
          return res.status(400).json({ error: 'Cannot remove the last admin' });
        }
        updateRole();
      }
    );
  } else {
    updateRole();
  }

  function updateRole() {
    db.run(
      `UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [role, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update role' });
        }
        res.json({ message: 'Role updated', role });
      }
    );
  }
});

// Get permissions for a role
router.get('/permissions/:role', verifyToken, (req, res) => {
  const role = req.params.role;

  const permissions = {
    'admin': [
      'manage-all',
      'manage-users',
      'manage-projects',
      'manage-clients',
      'manage-invoices',
      'view-reports',
      'manage-settings',
      'view-audit-logs'
    ],
    'manager': [
      'manage-projects',
      'manage-team',
      'assign-tasks',
      'view-reports',
      'manage-clients',
      'manage-invoices'
    ],
    'team-member': [
      'view-projects',
      'update-tasks',
      'comment',
      'view-reports'
    ],
    'client': [
      'view-projects',
      'comment',
      'approve-deliverables',
      'view-invoices'
    ],
    'guest': [
      'view-projects',
      'comment'
    ]
  };

  if (!permissions[role]) {
    return res.status(404).json({ error: 'Role not found' });
  }

  res.json({ role, permissions: permissions[role] });
});

module.exports = router;
