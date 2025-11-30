# Fix Backup 500 Error

**Problem:** Getting `500 Internal Server Error` when trying to backup a file

**Root Cause:** The database schema was created with the OLD structure before we added the new columns (`fileName`, `fileSize`, `completedAt`). The backup endpoint tries to insert these columns, but they don't exist in the database.

**Solution:** Reset the database to recreate tables with the new schema

---

## Quick Fix (2 minutes)

### Step 1: Stop the Server
In terminal where backend is running:
```
Ctrl + C
```

### Step 2: Delete Database File
```bash
cd backend
rm data.db
# Or on Windows:
# del data.db
```

### Step 3: Restart Server
```bash
npm start
```

Expected output:
```
Server running on http://localhost:3000
Connected to SQLite database
Admin user created: Liza (liza@gmail.com)
```

### Step 4: Test Backup
1. Login as admin: liza@gmail.com / 123456
2. Go to Team Dashboard
3. Click "Backup" on a file
4. Should see: ✅ "File backed up successfully!"
5. No 500 error!

---

## Why This Works

When you delete `data.db` and restart the server:
1. New database file is created
2. Database initialization runs automatically
3. **New backups table is created WITH all columns:**
   - ✅ fileName
   - ✅ fileSize
   - ✅ completedAt
4. Backup endpoint can now insert data successfully

---

## What Gets Lost

⚠️ Deleting `data.db` means:
- Old backups are deleted
- Old files records are deleted
- Old users are deleted (except admin is recreated)
- **New admin user is auto-created:**
  - Email: liza@gmail.com
  - Password: 123456

---

## If You Want to Keep Data

If you have important data in the old database, you can manually add the columns instead:

```bash
# Stop server first (Ctrl+C)
# Then run this (requires sqlite3 command line tool):

sqlite3 backend/data.db << EOF
ALTER TABLE backups ADD COLUMN fileName TEXT;
ALTER TABLE backups ADD COLUMN fileSize INTEGER;
ALTER TABLE backups ADD COLUMN completedAt DATETIME;
.quit
EOF

# Then restart: npm start
```

But this might fail if columns already exist. Easiest is to just delete and recreate.

---

## Step-by-Step Instructions

### Windows:
```powershell
# Stop server (Ctrl+C)
cd backend
del data.db
npm start
```

### Mac/Linux:
```bash
# Stop server (Ctrl+C)
cd backend
rm data.db
npm start
```

---

## Verify It Works

After restarting:

1. Open browser: http://localhost:3000
2. Logout if needed
3. Login as admin:
   - Email: liza@gmail.com
   - Password: 123456
4. Go to /admin
5. Click "Activity & Audit Logs" in menu
6. Go back to /dashboard (Team Dashboard)
7. Click "Backup" on any file
8. Should see green success message
9. Return to /admin → Activity & Audit Logs
10. Backup should appear in the Backup History Card!

---

## Complete Testing After Fix

### 1. Create Backup
```
Team Dashboard → Click Backup → Success message
```

### 2. View in Backup History
```
Admin Dashboard → Activity & Audit Logs → See Backup History Card
```

### 3. Verify Details
In the card, you should see:
- ✅ File name
- ✅ File size (e.g., "1.5 MB")
- ✅ Username
- ✅ Created timestamp
- ✅ Completed timestamp
- ✅ Status badge (green checkmark)

---

## If Still Getting Error

After deleting database and restarting:

**Check 1: Server Started Correctly?**
```
Terminal should show:
  "Server running on http://localhost:3000"
  "Admin user created: Liza..."
```

**Check 2: Database File Exists?**
```
Should see new: backend/data.db (small file, ~50KB)
```

**Check 3: Console Errors?**
```
F12 → Console tab
Look for red error messages
```

**Check 4: Network Error?**
```
F12 → Network tab
Click Backup button
Look for /api/backups/file/1 request
Should show 200 (not 500)
```

If still 500, check server terminal for error message.

---

## Summary

| Step | Command | Result |
|------|---------|--------|
| 1 | Stop server | Ctrl+C |
| 2 | Delete database | `rm data.db` |
| 3 | Restart server | `npm start` |
| 4 | Login as admin | liza@gmail.com / 123456 |
| 5 | Test backup | Click Backup button |
| 6 | Verify | See backup in Admin Dashboard |

---

## Expected Result

After following these steps:
- ✅ Backup button works
- ✅ No 500 error
- ✅ Backup appears in Backup History Card
- ✅ File details display correctly
- ✅ Auto-refresh works
- ✅ Status badges show properly

---

**Time to Fix:** ~2 minutes  
**Difficulty:** Easy  
**Data Loss:** Yes (database reset)  
**Rollback:** Not needed (automatic)

Let me know if this fixes the issue!
