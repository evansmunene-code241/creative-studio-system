const db = require('../config/database');

// Get pending users (awaiting approval)
const getPendingUsers = (req, res) => {
  db.all('SELECT id, username, email, createdAt FROM users WHERE status = ? ORDER BY createdAt DESC', ['pending'], (err, users) => {
    if (err) {
      console.error('Error getting pending users:', err);
      return res.status(500).json({ error: 'Failed to get pending users' });
    }
    res.json({ users: users || [] });
  });
};

// Approve user registration
const approveUser = (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  db.run('UPDATE users SET status = ? WHERE id = ?', ['approved', userId], function(err) {
    if (err) {
      console.error('Error approving user:', err);
      return res.status(500).json({ error: 'Failed to approve user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log action
    db.run(
      `INSERT INTO auditLogs (userId, action, details, createdAt)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, 'approve_user', `Approved user ID ${userId}`, new Date().toISOString()],
      (logErr) => {
        if (logErr) console.error('Error logging action:', logErr);
        res.json({ message: 'User approved successfully' });
      }
    );
  });
};

// Reject user registration
const rejectUser = (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  db.run('DELETE FROM users WHERE id = ? AND status = ?', [userId, 'pending'], function(err) {
    if (err) {
      console.error('Error rejecting user:', err);
      return res.status(500).json({ error: 'Failed to reject user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log action
    db.run(
      `INSERT INTO auditLogs (userId, action, details, createdAt)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, 'reject_user', `Rejected user ID ${userId}`, new Date().toISOString()],
      (logErr) => {
        if (logErr) console.error('Error logging action:', logErr);
        res.json({ message: 'User rejected successfully' });
      }
    );
  });
};

// Get all approved users
const getAllUsers = (req, res) => {
  db.all(
    `SELECT id, username, email, role, status, createdAt 
     FROM users 
     WHERE status = ? 
     ORDER BY createdAt DESC`,
    ['approved'],
    (err, users) => {
      if (err) {
        console.error('Error getting users:', err);
        return res.status(500).json({ error: 'Failed to get users' });
      }
      res.json(users || []);
    }
  );
};

// Delete user
const deleteUser = (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    if (user && user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], function(delErr) {
      if (delErr) {
        console.error('Error deleting user:', delErr);
        return res.status(500).json({ error: 'Failed to delete user' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log action
      db.run(
        `INSERT INTO auditLogs (userId, action, details, createdAt)
         VALUES (?, ?, ?, ?)`,
        [req.user.id, 'delete_user', `Deleted user ID ${userId}`, new Date().toISOString()],
        (logErr) => {
          if (logErr) console.error('Error logging action:', logErr);
          res.json({ message: 'User deleted successfully' });
        }
      );
    });
  });
};

// Get backup logs
const getBackupLogs = (req, res) => {
  db.all(
    `SELECT b.id, b.backupPath, b.status, b.createdAt, u.username
     FROM backups b
     LEFT JOIN users u ON b.userId = u.id
     ORDER BY b.createdAt DESC
     LIMIT 100`,
    (err, logs) => {
      if (err) {
        console.error('Error getting backup logs:', err);
        return res.status(500).json({ error: 'Failed to get backup logs' });
      }
      res.json({ logs: logs || [] });
    }
  );
};

// Get audit logs
const getAuditLogs = (req, res) => {
  db.all(
    `SELECT al.id, al.action, al.details, al.createdAt, u.username
     FROM auditLogs al
     LEFT JOIN users u ON al.userId = u.id
     ORDER BY al.createdAt DESC
     LIMIT 100`,
    (err, logs) => {
      if (err) {
        console.error('Error getting audit logs:', err);
        return res.status(500).json({ error: 'Failed to get audit logs' });
      }
      res.json({ logs: logs || [] });
    }
  );
};

// Get storage statistics
const getStorageStats = (req, res) => {
  // Get total users
  db.get('SELECT COUNT(*) as count FROM users WHERE status = ?', ['approved'], (err, totalUsersResult) => {
    if (err) {
      console.error('Error getting user count:', err);
      return res.status(500).json({ error: 'Failed to get storage stats' });
    }

    const totalUsers = totalUsersResult.count;

    // Get storage usage by user
    db.all(`
      SELECT u.id, u.username, 
             COALESCE(SUM(f.fileSize) / (1024.0 * 1024.0), 0) as usedMB
      FROM users u
      LEFT JOIN files f ON u.id = f.userId
      WHERE u.status = 'approved'
      GROUP BY u.id, u.username
      ORDER BY usedMB DESC
    `, (err, stats) => {
      if (err) {
        console.error('Error getting storage stats:', err);
        return res.status(500).json({ error: 'Failed to get storage stats' });
      }

      // Calculate totals
      const totalUsedMB = (stats || []).reduce((sum, stat) => sum + (stat.usedMB || 0), 0);
      const totalMaxMB = totalUsers * 50; // 50MB per user
      const overallPercentage = totalMaxMB > 0 ? Math.round((totalUsedMB / totalMaxMB) * 100) : 0;

      const summary = {
        totalUsers,
        totalUsedMB: Math.round(totalUsedMB * 100) / 100,
        totalMaxMB,
        overallPercentage
      };

      res.json({ summary, stats: stats || [] });
    });
  });
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  deleteUser,
  getBackupLogs,
  getAuditLogs,
  getStorageStats
};
