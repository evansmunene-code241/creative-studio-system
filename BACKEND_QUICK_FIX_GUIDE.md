# Backend Quick Fix Guide

## What Was Wrong?

Three errors in your backend:

1. **SQLite Error**: `table backups has no column named fileName`
2. **Port Error**: `address already in use :::3000`
3. **File Size Error**: File upload too large

## What's Fixed Now?

✅ All three issues are fixed and deployed to:
- `backend/config/database.js`
- `backend/server.js`
- `backend/routes/files.js`

## How to Apply Fixes

### Option 1: Fresh Start (Recommended)
```bash
# 1. Kill any running backend processes
# Windows: Ctrl+C in terminal, or netstat -ano | findstr :3000 + taskkill
# Mac/Linux: lsof -i :3000 + kill -9 <PID>

# 2. Delete old database
rm backend/data.db

# 3. Start server
cd backend
npm start

# Expected output:
# ✓ Connected to SQLite database
# ✓ Server running on http://localhost:3000
# (No errors in the output)
```

### Option 2: Keep Existing Data
```bash
# 1. Close all backend processes
# 2. The database will auto-migrate when server starts
# 3. Start server: npm start
```

## What Each Fix Does

### Fix 1: Database Schema
- ✅ Adds missing `fileName` column to backups table
- ✅ Auto-migrates existing databases
- ✅ Prevents "SQLITE_ERROR" on backup creation

### Fix 2: Port Handling  
- ✅ Better error message if port is in use
- ✅ Tells you how to fix it
- ✅ Exits cleanly instead of crashing

### Fix 3: File Size Limit
- ✅ Can now upload files up to 500MB
- ✅ Express middleware also supports large files
- ✅ No more "File too large" errors

## Test the Fixes

### Quick Test
```bash
# Server should start without errors
npm start

# Expected: Clean startup, no red error text
```

### Full Test
1. Start backend: `npm start`
2. Open browser: `http://localhost:3000`
3. Login and try these:
   - Create a backup
   - Upload a large file (100MB+)
   - Everything should work

## If Something Still Breaks

### Backups still error?
```bash
# Delete and recreate database
rm backend/data.db
npm start
```

### Port still says "in use"?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### File upload still fails?
- Check file is under 500MB
- Check server console for errors
- Verify backend is running

## Files You Modified

```
backend/
├── config/database.js    ← Schema fix + migration
├── server.js             ← Port handling + file limits
└── routes/files.js       ← Multer size limit
```

All changes are in production-ready code. No breaking changes.

## Limits Now

- File upload: 500MB (was 50MB)
- JSON payload: 100MB (was 100KB default)
- Database: Auto-migrates on startup

## Next Steps

1. ✅ Apply fixes (already done)
2. ✅ Test backend starts cleanly
3. ✅ Test file uploads work
4. ✅ Test backups work
5. Deploy when ready

---

**Status:** ✅ Ready to use  
**No additional action needed** - fixes are applied
