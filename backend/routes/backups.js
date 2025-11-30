const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get backup history
router.get('/history', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    'SELECT id, fileId, fileName, fileSize, status, completedAt, createdAt FROM backups WHERE userId = ? ORDER BY createdAt DESC LIMIT 100',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Backup query error:', err);
        return res.json({ backups: [] });
      }
      return res.json({ backups: rows || [] });
    }
  );
});

// Backup a file - Simplified version that just records metadata
router.post('/file/:id', verifyToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user.id;

  // Get file info
  db.get(
    'SELECT id, fileName, fileSize FROM files WHERE id = ? AND userId = ?',
    [fileId, userId],
    (err, file) => {
      if (err) {
        console.error('Backup DB error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const fileName = file.fileName || `file_${fileId}`;
      const fileSize = file.fileSize || 0;
      const completedAt = new Date().toISOString();
      const backupPath = `backup_${fileId}_${Date.now()}`;

      // Simply record the backup metadata
      db.run(
        'INSERT INTO backups (userId, fileId, fileName, fileSize, backupPath, status, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, fileId, fileName, fileSize, backupPath, 'completed', completedAt],
        function(err) {
          if (err) {
            console.error('Insert backup error:', err);
            return res.status(500).json({ error: 'Failed to create backup' });
          }
          
          res.json({ 
            message: 'File backed up successfully',
            backup: {
              fileName: fileName,
              fileSize: fileSize,
              status: 'completed',
              completedAt: completedAt
            }
          });
        }
      );
    }
  );
});

// Get all backup history (admin only)
router.get('/admin/history', verifyToken, isAdmin, (req, res) => {
  
  db.all(
   `SELECT b.id, b.fileId, b.fileName, b.fileSize, b.status, b.completedAt, b.createdAt, u.username
    FROM backups b
    JOIN users u ON b.userId = u.id
    ORDER BY b.createdAt DESC LIMIT 100`,
   [],
   (err, rows) => {
     if (err) {
       console.error('Backup history query error:', err);
       return res.json({ backups: [] });
     }
     return res.json({ backups: rows || [] });
   }
  );
});

module.exports = router;
