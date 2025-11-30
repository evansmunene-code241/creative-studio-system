# Creative Studio System - Startup Guide

## Quick Start (2 Steps)

### Step 1: Start Backend Server
```bash
cd backend
npm start
```

**Expected Output:**
```
Server running on http://localhost:3000
Connected to SQLite database
Admin user created: Liza (liza@gmail.com)
```

### Step 2: Open Frontend in Browser
```
http://localhost:3000
```

---

## Default Login Credentials

- **Email:** liza@gmail.com
- **Password:** 123456

---

## Troubleshooting 404 Errors

### Error: "Unexpected token '<', '<!DOCTYPE'"
This means the backend is not running or the frontend is serving instead of the API.

**Solution:**
1. Make sure backend is running on port 3000
2. Check that you see "Server running on http://localhost:3000" in the terminal
3. Verify no other process is using port 3000

### Check if Backend is Running
Open in browser: `http://localhost:3000/api/health`

**Should return:**
```json
{ "status": "OK" }
```

---

## Detailed Setup

### Prerequisites
- Node.js (v12+)
- npm (comes with Node.js)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
- SQLite database (`data.db`) is created automatically
- Admin user (liza@gmail.com) is created automatically on first run

### 3. Environment Variables
Create `.env` file in backend folder (already created):
```
PORT=3000
JWT_SECRET=creative_studio_jwt_secret_key_2025
```

### 4. Start Server
```bash
npm start
```

### 5. Access Frontend
- **Main URL:** http://localhost:3000
- **Admin:** http://localhost:3000/admin
- **Dashboard:** http://localhost:3000/dashboard
- **Client Portal:** http://localhost:3000/client
- **Financial:** http://localhost:3000/financial

---

## API Endpoints

All API endpoints are prefixed with `/api`:

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login

### Projects
- GET `/api/projects` - Get all projects
- POST `/api/projects` - Create project
- PUT `/api/projects/:id` - Update project
- DELETE `/api/projects/:id` - Delete project

### Tasks
- GET `/api/tasks` - Get all tasks
- POST `/api/tasks` - Create task
- PUT `/api/tasks/:id` - Update task

### Admin
- GET `/api/admin/pending-users` - Get pending approvals
- POST `/api/admin/approve-user` - Approve user
- GET `/api/admin/audit-logs` - Get audit logs
- GET `/api/admin/storage-stats` - Get storage info

### Financial
- GET `/api/invoices` - Get invoices
- POST `/api/invoices` - Create invoice
- GET `/api/payments` - Get payments
- POST `/api/payments` - Record payment
- GET `/api/expenses` - Get expenses
- POST `/api/expenses` - Add expense

---

## Common Issues

### Port 3000 Already in Use
```bash
# Windows - Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Database Locked
- Stop the server and delete `backend/data.db`
- Restart server (database will be recreated)

### CORS Errors
- Make sure backend is running
- Check that frontend API_URL matches server address

### 404 JSON Parse Errors
- Backend is not running or crashed
- Check terminal for error messages
- Restart with: `npm start`

---

## Development Tips

### Real-time Reloading
```bash
npm install --save-dev nodemon
```

Edit `package.json`:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Then use: `npm run dev`

### Check Server Health
```
http://localhost:3000/api/health
```

### View Database
Install SQLite viewer or use command line:
```bash
sqlite3 backend/data.db
```

---

## File Structure

```
creative studio system/
├── backend/
│   ├── server.js           (Main server)
│   ├── package.json        (Dependencies)
│   ├── .env               (Configuration)
│   ├── data.db            (SQLite database)
│   ├── config/
│   │   ├── database.js    (DB setup)
│   │   └── env.js         (Config)
│   ├── routes/            (API endpoints)
│   ├── middleware/        (Auth, etc)
│   └── controllers/       (Business logic)
│
└── frontend/
    ├── index.html         (Login)
    ├── admin_dashboard.html
    ├── dashboard.html
    ├── client_portal.html
    ├── financial_dashboard.html
    ├── css/              (Stylesheets)
    └── js/               (JavaScript)
```

---

## Next Steps

1. **Start Backend:** `cd backend && npm start`
2. **Open Browser:** `http://localhost:3000`
3. **Login:** liza@gmail.com / 123456
4. **Explore:** Admin Dashboard → Projects → Financials

---

**Status:** ✅ System Ready to Use
**Version:** 3.0
**Date:** November 29, 2025
