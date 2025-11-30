const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get current time in East African Time
function getEATTimestamp() {
  const now = new Date();
  // Create formatter for EAT timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Get the formatted date parts
  const parts = formatter.formatToParts(now);
  const partMap = {};
  parts.forEach(part => {
    partMap[part.type] = part.value;
  });
  
  // Create ISO-like string in EAT
  const eatDate = `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}Z`;
  return eatDate;
}

const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = req.user.id;
  const { filename: originalName } = req.file;
  const filePath = req.file.path;
  const fileSize = req.file.size;
  const eatTimestamp = getEATTimestamp();

  db.run(
    'INSERT INTO files (userId, filename, originalName, fileSize, filePath, uploadedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, req.file.filename, originalName, fileSize, filePath, eatTimestamp],
    function(err) {
      if (err) {
        fs.unlink(filePath, () => {}); // Delete uploaded file on error
        return res.status(500).json({ error: 'Failed to save file record' });
      }

      // Log audit
      db.run('INSERT INTO auditLogs (userId, action, details) VALUES (?, ?, ?)',
        [userId, 'FILE_UPLOAD', `Uploaded: ${originalName}`]);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: this.lastID,
          filename: req.file.filename,
          originalName,
          fileSize,
          uploadedAt: eatTimestamp
        }
      });
    }
  );
};

const getUserFiles = (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT id, filename, originalName, fileSize, uploadedAt FROM files WHERE userId = ? ORDER BY uploadedAt DESC',
    [userId],
    (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch files' });
      }
      res.json({ files: files || [] });
    }
  );
};

const downloadFile = (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM files WHERE id = ? AND userId = ?',
    [fileId, userId],
    (err, file) => {
      if (err || !file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Log audit
      db.run('INSERT INTO auditLogs (userId, action, details) VALUES (?, ?, ?)',
        [userId, 'FILE_DOWNLOAD', `Downloaded: ${file.originalName}`]);

      res.download(file.filePath, file.originalName);
    }
  );
};

const deleteFile = (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM files WHERE id = ? AND userId = ?',
    [fileId, userId],
    (err, file) => {
      if (err || !file) {
        return res.status(404).json({ error: 'File not found' });
      }

      db.run('DELETE FROM files WHERE id = ?', [fileId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: 'Failed to delete file' });
        }

        fs.unlink(file.filePath, () => {}); // Delete physical file
        
        db.run('INSERT INTO auditLogs (userId, action, details) VALUES (?, ?, ?)',
          [userId, 'FILE_DELETE', `Deleted: ${file.originalName}`]);

        res.json({ message: 'File deleted successfully' });
      });
    }
  );
};

const getStorageStats = (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT SUM(fileSize) as totalSize FROM files WHERE userId = ?',
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to get storage stats' });
      }

      const usedStorage = result?.totalSize || 0;
      const maxStorage = 50 * 1024 * 1024; // 50MB
      const percentage = Math.round((usedStorage / maxStorage) * 100);

      res.json({
        used: usedStorage,
        max: maxStorage,
        percentage,
        usedMB: (usedStorage / (1024 * 1024)).toFixed(2),
        maxMB: (maxStorage / (1024 * 1024)).toFixed(2)
      });
    }
  );
};

module.exports = { uploadFile, getUserFiles, downloadFile, deleteFile, getStorageStats };
