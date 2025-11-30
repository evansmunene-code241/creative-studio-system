const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create notifications table if needed (should be in database.js)
const createNotificationsTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      relatedId INTEGER,
      relatedType TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

// Initialize table on startup
createNotificationsTable();

// Get notifications for user
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit || 50;

  db.all(
    `SELECT * FROM notifications 
     WHERE userId = ? 
     ORDER BY createdAt DESC 
     LIMIT ?`,
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get unread notifications
router.get('/unread', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT * FROM notifications 
     WHERE userId = ? AND isRead = 0
     ORDER BY createdAt DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get unread count
router.get('/count', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ unreadCount: row.count });
    }
  );
});

// Mark notification as read
router.put('/:id/read', verifyToken, (req, res) => {
  const notificationId = req.params.id;

  db.run(
    `UPDATE notifications SET isRead = 1 WHERE id = ?`,
    [notificationId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update notification' });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

// Mark all as read
router.put('/read-all', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.run(
    `UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0`,
    [userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update notifications' });
      }
      res.json({ message: 'All notifications marked as read' });
    }
  );
});

// Delete notification
router.delete('/:id', verifyToken, (req, res) => {
  db.run(
    `DELETE FROM notifications WHERE id = ?`,
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete notification' });
      }
      res.json({ message: 'Notification deleted' });
    }
  );
});

// Helper function to create notification (called internally)
function createNotification(userId, type, title, message, relatedId, relatedType) {
  db.run(
    `INSERT INTO notifications (userId, type, title, message, relatedId, relatedType)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, title, message, relatedId, relatedType]
  );
}

module.exports = { router, createNotification };
