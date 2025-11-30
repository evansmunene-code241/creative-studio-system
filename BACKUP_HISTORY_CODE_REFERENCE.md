# Backup History Card - Code Reference

**Quick Code Lookup for Implementation Details**

---

## Database Schema

### Backups Table
```sql
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  fileId INTEGER,
  fileName TEXT,                    -- NEW: File name
  backupPath TEXT NOT NULL,
  fileSize INTEGER,                 -- NEW: File size in bytes
  status TEXT DEFAULT 'success',
  completedAt DATETIME,             -- NEW: Completion timestamp
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE
)
```

**New Columns:**
- `fileName TEXT` - Name of the backed-up file
- `fileSize INTEGER` - Size in bytes
- `completedAt DATETIME` - When backup finished

---

## Backend API Endpoints

### Get Admin Backup History
```javascript
// Route: GET /api/backups/admin/history
// Auth Required: JWT token (admin or manager role)
// Returns: Array of backup objects with user info

// Query:
SELECT b.id, b.fileName, b.fileSize, b.status, b.completedAt, 
       b.createdAt, u.username
FROM backups b
JOIN users u ON b.userId = u.id
ORDER BY b.createdAt DESC LIMIT 100

// Response:
{
  "backups": [
    {
      "id": 1,
      "fileName": "annual-budget-2025.xlsx",
      "fileSize": 2654321,
      "status": "completed",
      "completedAt": "2025-11-30T14:30:45.000Z",
      "createdAt": "2025-11-30T14:30:00.000Z",
      "username": "Admin User"
    },
    ...
  ]
}
```

### Create Backup (Enhanced)
```javascript
// Route: POST /api/backups/file/:id
// Auth Required: JWT token
// Returns: Backup details

// Request: 
POST /api/backups/file/5

// Response:
{
  "message": "File backed up successfully",
  "backup": {
    "fileName": "document.pdf",
    "fileSize": 2654321,
    "status": "completed",
    "completedAt": "2025-11-30T14:30:45.000Z"
  }
}
```

### Get User Backup History
```javascript
// Route: GET /api/backups/history
// Auth Required: JWT token
// Returns: User's own backups

// Query:
SELECT id, fileName, fileSize, status, completedAt, createdAt 
FROM backups 
WHERE userId = ? 
ORDER BY createdAt DESC LIMIT 100

// Response:
{
  "backups": [
    {
      "id": 1,
      "fileName": "project-doc.pdf",
      "fileSize": 2654321,
      "status": "completed",
      "completedAt": "2025-11-30T14:30:45.000Z",
      "createdAt": "2025-11-30T14:30:00.000Z"
    }
  ]
}
```

---

## Backend Route Implementation

### File: `backend/routes/backups.js`

#### Enhanced Get History Endpoint
```javascript
router.get('/history', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    'SELECT id, fileName, fileSize, status, completedAt, createdAt FROM backups WHERE userId = ? ORDER BY createdAt DESC LIMIT 100',
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
```

#### Enhanced Backup Creation
```javascript
router.post('/file/:id', verifyToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    'SELECT * FROM files WHERE id = ? AND userId = ?',
    [fileId, userId],
    (err, file) => {
      if (err || !file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupName = `${Date.now()}_${path.basename(file.filePath)}`;
      const backupPath = path.join(backupDir, backupName);

      try {
        fs.copyFileSync(file.filePath, backupPath);
        const stats = fs.statSync(backupPath);
        const completedAt = new Date().toISOString();

        db.run(
          'INSERT INTO backups (userId, fileId, fileName, fileSize, backupPath, status, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, fileId, file.fileName, stats.size, backupPath, 'completed', completedAt],
          (err) => {
            if (err) {
              fs.unlinkSync(backupPath);
              return res.status(500).json({ error: 'Failed to record backup' });
            }
            res.json({ 
              message: 'File backed up successfully',
              backup: {
                fileName: file.fileName,
                fileSize: stats.size,
                status: 'completed',
                completedAt: completedAt
              }
            });
          }
        );
      } catch (error) {
        console.error('Backup error:', error);
        db.run(
          'INSERT INTO backups (userId, fileId, fileName, backupPath, status) VALUES (?, ?, ?, ?, ?)',
          [userId, fileId, file.fileName, backupPath, 'failed'],
          () => {}
        );
        res.status(500).json({ error: 'Backup failed: ' + error.message });
      }
    }
  );
});
```

#### New Admin History Endpoint
```javascript
router.get('/admin/history', verifyToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    `SELECT b.id, b.fileName, b.fileSize, b.status, b.completedAt, b.createdAt, u.username
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
```

---

## Frontend HTML

### File: `frontend/admin_dashboard.html`

```html
<!-- Backup History Card -->
<div class="card">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h3>📦 Backup History</h3>
    <div style="font-size: 12px; color: #666;">
      <span id="backupCount">0</span> backups
    </div>
  </div>
  <div id="backupHistoryCard">
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading backup history...</p>
    </div>
  </div>
</div>
```

---

## Frontend JavaScript

### File: `frontend/js/admin.js`

#### Main Load Function
```javascript
function loadBackupHistory() {
  const container = document.getElementById('backupHistoryCard');
  const countSpan = document.getElementById('backupCount');

  fetch(`${API_URL}/backups/admin/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.backups || data.backups.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>📭 No backups yet</p></div>';
        countSpan.textContent = '0';
        return;
      }

      countSpan.textContent = data.backups.length;

      const backupHTML = data.backups.slice(0, 20).map(backup => {
        const date = new Date(backup.createdAt);
        const completedAt = backup.completedAt ? new Date(backup.completedAt) : null;
        const fileSize = backup.fileSize ? formatFileSize(backup.fileSize) : 'N/A';
        const statusBadge = backup.status === 'completed' 
          ? '<span class="backup-status-completed">✅ Completed</span>'
          : backup.status === 'failed'
          ? '<span class="backup-status-failed">❌ Failed</span>'
          : '<span class="backup-status-pending">⏳ Pending</span>';

        return `
          <div class="backup-history-item">
            <div class="backup-header">
              <div class="backup-info">
                <h4>${escapeHtml(backup.fileName)}</h4>
                <div class="backup-meta">
                  <span class="backup-user">👤 ${escapeHtml(backup.username)}</span>
                  <span class="backup-size">💾 ${fileSize}</span>
                  <span class="backup-time">${date.toLocaleString()}</span>
                </div>
              </div>
              <div class="backup-status-container">
                ${statusBadge}
              </div>
            </div>
            ${completedAt ? `<div class="backup-footer">Completed: ${completedAt.toLocaleString()}</div>` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="backup-history-list">
          ${backupHTML}
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
          Showing latest ${Math.min(20, data.backups.length)} of ${data.backups.length} backups
        </div>
      `;
    })
    .catch(err => {
      console.error('Error loading backup history:', err);
      container.innerHTML = '<div class="error"><p>Failed to load backup history</p></div>';
    });
}
```

#### Helper Function
```javascript
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

#### Initialization
```javascript
// Call on page load
document.addEventListener('DOMContentLoaded', function() {
  // ... other code ...
  loadBackupHistory();  // Add this
  loadBackupLogs();
  loadAuditLogs();
  // ... rest of init ...
});
```

#### Auto-Refresh
```javascript
// Refresh every 60 seconds
setInterval(() => {
  loadBackupHistory();  // Add this
  loadBackupLogs();
  loadAuditLogs();
  // ... other refreshes ...
}, 60000);
```

#### Manual Refresh on Section Click
```javascript
function showSection(sectionName) {
  // ... hide other sections ...
  
  if (sectionName === 'logs') {
    loadBackupHistory();  // Add this
    loadBackupLogs();
    loadAuditLogs();
  }
  
  // ... show section ...
}
```

---

## Frontend CSS

### File: `frontend/css/admin.css`

```css
/* Backup History Card Styles */
.backup-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-history-item {
  padding: 15px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.backup-history-item:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
  border-color: #c7d2fe;
}

.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.backup-info h4 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  word-break: break-word;
}

.backup-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.backup-user,
.backup-size,
.backup-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.backup-status-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 120px;
}

.backup-status-completed,
.backup-status-failed,
.backup-status-pending {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.backup-status-completed {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.backup-status-failed {
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fca5a5;
}

.backup-status-pending {
  background: #fef3c7;
  color: #78350f;
  border: 1px solid #fcd34d;
}

.backup-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e0e7ff;
  font-size: 11px;
  color: #94a3b8;
  text-align: right;
}
```

---

## Data Object Structure

### Backup Object (from API)
```javascript
{
  id: 1,                                      // Database ID
  fileName: "annual-budget-2025.xlsx",        // File name
  fileSize: 2654321,                          // Bytes
  status: "completed",                        // "completed", "failed", "pending"
  completedAt: "2025-11-30T14:30:45.000Z",   // ISO timestamp
  createdAt: "2025-11-30T14:30:00.000Z",     // ISO timestamp
  username: "Admin User"                      // From users table
}
```

---

## Function Call Chain

```
Page Load
  ↓
DOMContentLoaded event
  ↓
loadBackupHistory()
  ↓
fetch('/api/backups/admin/history')
  ↓
formatFileSize(bytes)
  ↓
Render backup cards
  ↓
Display in DOM
  ↓
Every 60 seconds:
  ↓
setInterval → loadBackupHistory()
  ↓
Repeat from fetch...
```

---

## Status Badge Mapping

```javascript
status = 'completed' → ✅ Completed (green)
status = 'failed'    → ❌ Failed (red)
status = 'pending'   → ⏳ Pending (yellow)
```

---

## Error Handling

### Backend Errors
```javascript
// Role check fails
Response: { error: 'Access denied' }
Status: 403

// Database error
Response: { backups: [] }
Status: 200 (graceful fallback)

// Backup creation fails
Response: { error: 'Backup failed: ...' }
Status: 500
```

### Frontend Errors
```javascript
// Network error
Catch block: console.error + UI message

// Empty data
Display: "📭 No backups yet"

// Render error
Display: "Failed to load backup history"
```

---

## Performance Optimizations

```javascript
// Database query limits
LIMIT 100 backups per query

// Frontend display limit
Show only 20 backups to user

// Auto-refresh interval
60000ms (60 seconds)

// File size calculation
Once per backup (< 1ms each)

// DOM updates
Replace innerHTML (faster than DOM methods)
```

---

## Testing Code Snippets

### Test in Console
```javascript
// Manually fetch backup history
fetch('/api/backups/admin/history', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log(d))

// Test file size formatter
formatFileSize(1234567)  // Returns "1.18 MB"

// Manually trigger load
loadBackupHistory()
```

### Test API with cURL
```bash
# Get backup history
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/backups/admin/history

# Create backup
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/backups/file/1
```

---

## Integration Points

| Component | Integration | How It Works |
|-----------|-------------|------------|
| Dashboard | Menu item | Click "Activity & Audit Logs" |
| Auto-refresh | setInterval | Every 60 seconds |
| Manual refresh | Click handler | Same function as auto-refresh |
| Database | SQL query | JOINs backups and users tables |
| API Auth | JWT verification | verifyToken middleware |

---

## Common Code Patterns

### Pattern: Format Data
```javascript
const date = new Date(backup.createdAt);
const size = formatFileSize(backup.fileSize);
const status = backup.status === 'completed' ? '✅' : '❌';
```

### Pattern: Conditional Rendering
```javascript
${completedAt ? `<div>Completed: ${completedAt.toLocaleString()}</div>` : ''}
```

### Pattern: Error Handling
```javascript
.catch(err => {
  console.error('Error:', err);
  container.innerHTML = '<div class="error">...</div>';
});
```

---

## Code Statistics

| Metric | Count |
|--------|-------|
| Backend functions | 3 |
| Frontend functions | 2 |
| CSS classes | 11 |
| API endpoints | 3 (1 new) |
| Database columns | 3 new |
| Total lines | ~300 |
| HTML lines | ~18 |
| CSS lines | ~103 |
| JS lines | ~130 |

---

**This reference provides exact code for the Backup History Card implementation**
