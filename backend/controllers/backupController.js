const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get current time in East African Time
function getEATTimestamp() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const partMap = {};
  parts.forEach(part => {
    partMap[part.type] = part.value;
  });
  
  return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}Z`;
}

const getUserBackups = (req, res) => {
  const userId = req.user.id;

  // Simple query without JOIN to avoid issues
  db.all(
    'SELECT id, status, createdAt FROM backups WHERE userId = ? ORDER BY createdAt DESC LIMIT 100',
    [userId],
    (err, backups) => {
      if (err) {
        console.error('Error fetching backups:', err);
        // Return empty array if table doesn't exist
        return res.json({ backups: [] });
      }
      res.json({ backups: backups || [] });
    }
  );
};

const performBackup = (fileId, userId, callback) => {
  db.get(
    'SELECT * FROM files WHERE id = ? AND userId = ?',
    [fileId, userId],
    (err, file) => {
      if (err || !file) {
        return callback(false);
      }

      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, `${Date.now()}_${file.filename}`);

      try {
        fs.copyFileSync(file.filePath, backupPath);
        const eatTimestamp = getEATTimestamp();

        db.run(
          'INSERT INTO backups (userId, fileId, backupPath, status, createdAt) VALUES (?, ?, ?, ?, ?)',
          [userId, fileId, backupPath, 'success', eatTimestamp],
          function(err) {
            if (err) {
              fs.unlink(backupPath, () => {});
              return callback(false);
            }
            callback(true, this.lastID);
          }
        );
      } catch (error) {
        callback(false);
      }
    }
  );
};

const manualBackupFile = (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  performBackup(fileId, userId, (success, backupId) => {
    if (success) {
      res.json({ message: 'File backed up successfully', backupId });
    } else {
      res.status(500).json({ error: 'Backup failed' });
    }
  });
};

const backupAllUserFiles = (userId, callback) => {
  db.all(
    'SELECT id FROM files WHERE userId = ?',
    [userId],
    (err, files) => {
      if (err || !files || files.length === 0) {
        return callback(0);
      }

      let backed = 0;
      files.forEach(file => {
        performBackup(file.id, userId, (success) => {
          if (success) backed++;
          if (backed === files.length) callback(backed);
        });
      });
    }
  );
};

module.exports = {
  getUserBackups,
  manualBackupFile,
  performBackup,
  backupAllUserFiles
};
