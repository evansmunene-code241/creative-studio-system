const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get messages for current user
router.get('/messages', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT m.*, u.username as senderName, p.name as projectName
     FROM messages m
     LEFT JOIN users u ON m.senderId = u.id
     LEFT JOIN projects p ON m.projectId = p.id
     WHERE m.recipientId = ? OR m.senderId = ?
     ORDER BY m.createdAt DESC
     LIMIT 100`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get conversation for a project
router.get('/project/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user.id;

  // Check access to project
  db.get(
    `SELECT assignedTo, createdBy FROM projects WHERE id = ?`,
    [projectId],
    (err, project) => {
      if (err || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      db.all(
        `SELECT m.*, u.username as senderName, u.role
         FROM messages m
         LEFT JOIN users u ON m.senderId = u.id
         WHERE m.projectId = ?
         ORDER BY m.createdAt ASC`,
        [projectId],
        (err, messages) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(messages || []);
        }
      );
    }
  );
});

// Send message
router.post('/send', verifyToken, (req, res) => {
  const { recipientId, projectId, clientId, subject, content, type } = req.body;
  const senderId = req.user.id;

  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  db.run(
    `INSERT INTO messages (senderId, recipientId, projectId, clientId, subject, content, type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [senderId, recipientId, projectId, clientId, subject, content, type || 'message'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to send message' });
      }
      res.status(201).json({ id: this.lastID, message: 'Message sent' });
    }
  );
});

// Mark message as read
router.put('/:messageId/read', verifyToken, (req, res) => {
  db.run(
    `UPDATE messages SET isRead = 1 WHERE id = ?`,
    [req.params.messageId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update message' });
      }
      res.json({ message: 'Message marked as read' });
    }
  );
});

// Get unread message count
router.get('/unread/count', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT COUNT(*) as count FROM messages WHERE recipientId = ? AND isRead = 0`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ unreadCount: row.count });
    }
  );
});

// Delete message
router.delete('/:messageId', verifyToken, (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;

  db.get(
    `SELECT senderId, recipientId FROM messages WHERE id = ?`,
    [messageId],
    (err, message) => {
      if (err || !message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Only sender or recipient can delete
      if (message.senderId !== userId && message.recipientId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      db.run(
        `DELETE FROM messages WHERE id = ?`,
        [messageId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete message' });
          }
          res.json({ message: 'Message deleted' });
        }
      );
    }
  );
});

// Get project discussion thread
router.get('/thread/:projectId', verifyToken, (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `SELECT m.*, u.username as senderName, u.role, u.profilePic
     FROM messages m
     LEFT JOIN users u ON m.senderId = u.id
     WHERE m.projectId = ?
     ORDER BY m.createdAt ASC`,
    [projectId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Group by type if needed
      const grouped = {
        messages: rows.filter(r => r.type === 'message') || [],
        approvals: rows.filter(r => r.type === 'approval') || [],
        updates: rows.filter(r => r.type === 'update') || []
      };

      res.json(grouped);
    }
  );
});

module.exports = router;
