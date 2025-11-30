# System Verification Checklist

## Before Starting Backend

- [ ] Node.js is installed: `node --version`
- [ ] npm is installed: `npm --version`
- [ ] You're in the `backend` folder

## After Starting Backend

### 1. Check Server is Running
```
Expected in Terminal:
✓ Server running on http://localhost:3000
✓ Connected to SQLite database
✓ Admin user created: Liza (liza@gmail.com)
```

### 2. Test Health Endpoint
Open browser: `http://localhost:3000/api/health`

**Expected Response:**
```json
{ "status": "OK" }
```

### 3. Verify Frontend Loads
Open browser: `http://localhost:3000`

**Expected:** Login page loads with email/password fields

### 4. Test Login
- Email: `liza@gmail.com`
- Password: `123456`

**Expected:** Redirects to Admin Dashboard

### 5. Check API Calls in Browser
Open DevTools (F12) → Console

**Should NOT see:**
- ❌ "Unexpected token '<', '<!DOCTYPE'"
- ❌ "404 Not Found"
- ❌ "Failed to load resource"

**Should see successful responses**

---

## If Something Fails

### Error: "Cannot find module"
```bash
cd backend
npm install
```

### Error: "Port 3000 already in use"
```
Windows: taskkill /F /IM node.exe
Mac/Linux: lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Error: Database locked
```
Stop server
Delete: backend/data.db
Restart server
```

### Error: "Unexpected token '<', '<!DOCTYPE'"
- Backend is NOT running
- Frontend is serving HTML instead of JSON API response
- Start backend with: `npm start`

### Error: "Invalid or expired token"
- Login again: `liza@gmail.com` / `123456`
- Clear browser cookies/localStorage
- Try in incognito/private mode

---

## Quick Test Requests

### Using PowerShell (Windows)

#### Test Health:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
```

#### Test Login:
```powershell
$body = @{
    email = "liza@gmail.com"
    password = "123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

$response | ConvertTo-Json
```

### Using curl (Mac/Linux)

#### Test Health:
```bash
curl http://localhost:3000/api/health
```

#### Test Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"liza@gmail.com","password":"123456"}'
```

---

## System Status

### ✅ Fixed Issues
- Duplicate API_URL declarations → Unified in config.js
- Script loading order → Corrected in HTML
- showSection() undefined → Function properly loaded

### ✅ Backend Ready
- All routes defined
- Database initialization ready
- Auth middleware configured
- Admin user (liza@gmail.com/123456) pre-created

### ⏳ Needs to Start
- Backend server (`npm start` in backend folder)

### 📋 Next Steps
1. Open terminal in `backend` folder
2. Run: `npm start`
3. Wait for "Server running on http://localhost:3000"
4. Open browser to: `http://localhost:3000`
5. Login with liza@gmail.com / 123456

---

**Status:** ✅ Ready for Startup
