# 401 Unauthorized Error - Fix Guide

## Problem
When trying to access dashboard endpoints (files/list, files/upload, backups/history, etc.), you get:
```
401 (Unauthorized)
api/files/list:1 Failed to load resource: the server responded with a status of 401
```

## Root Cause
**Token payload mismatch** - The JWT token being generated during login was missing the `username` field, but the authentication middleware was trying to read it.

**The issue:**
1. Login endpoint generates token with: `{ id, role, email }`
2. Auth middleware tries to extract: `{ id, username, email, role }`
3. Missing `username` causes token verification to fail

## Solution (Already Applied ✓)

### File: `backend/controllers/authController.js` (Line 59-63)

**Before:**
```javascript
const token = jwt.sign(
  { id: user.id, role, email: user.email },
  config.JWT_SECRET,
  { expiresIn: config.JWT_EXPIRE }
);
```

**After:**
```javascript
const token = jwt.sign(
  { id: user.id, username: user.username, role, email: user.email },
  config.JWT_SECRET,
  { expiresIn: config.JWT_EXPIRE }
);
```

## Steps to Fix

### 1. **Restart Backend Server**
```bash
# Stop the server (Ctrl+C)
# Then restart it
npm start
```

### 2. **Clear Browser Cache & Local Storage**
- Press `F12` to open Developer Tools
- Go to **Application/Storage** tab
- Click **Local Storage** → Select your site URL
- Delete the `token` and `user` entries
- Close DevTools

### 3. **Login Again**
- Go to login page (http://localhost:3000)
- Enter your credentials
- You should now have a properly formatted token

### 4. **Verify it Works**
- Dashboard should load without 401 errors
- Files should list properly
- File upload should work

## Why This Happened

The frontend code in `dashboard.js` expects the middleware to populate `req.user` with all fields:
```javascript
req.user = {
  id: decoded.id,
  username: decoded.username,  // ← This was missing from token
  email: decoded.email,
  role: decoded.role || 'team-member'
};
```

When `decoded.username` was undefined, the entire token verification failed with 401.

## Prevention

For future token generation, always include all required fields:
```javascript
const token = jwt.sign(
  { 
    id: user.id, 
    username: user.username,  // ✓ Required
    email: user.email,         // ✓ Required
    role: isAdmin ? 'admin' : 'user'  // ✓ Required
  },
  config.JWT_SECRET,
  { expiresIn: config.JWT_EXPIRE }
);
```

## If Problem Persists

### Check 1: Verify JWT_SECRET is consistent
File: `backend/config/env.js`
- Make sure same secret is used for signing and verifying
- Default: `'your_jwt_secret_key_change_this'`

### Check 2: Verify token format in localStorage
Open DevTools Console and run:
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);
console.log('Token parts:', token.split('.').length); // Should be 3
```

### Check 3: Check Network tab
- Open DevTools → Network tab
- Try accessing dashboard
- Click on failed request (e.g., `files/list`)
- Check **Request Headers** → Authorization header
- Should show: `Authorization: Bearer eyJhbGc...`

### Check 4: Backend Logs
Look for errors in backend console:
```
Invalid or expired token
No token provided
```

## Quick Test

To manually test if authentication is working:

```bash
# 1. Get token from login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}'

# 2. Copy the returned token

# 3. Test it on a protected endpoint
curl -X GET http://localhost:3000/api/files/list \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Should return your files list instead of 401 error.

---

**Status:** ✓ FIXED
**Date Fixed:** Today
**Test:** Login and verify dashboard loads
