# Creative Studio System - Quick Start Guide

## 🚀 Installation (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Start Server
```bash
npm start
```

Expected output:
```
Server running on http://localhost:3000
Connected to SQLite database
Admin user created: Liza (liza@gmail.com)
```

### Step 3: Access Application
- **Login Page:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin
- **Client Portal:** http://localhost:3000/client

---

## 👤 Default Login Credentials

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Admin | Liza | liza@gmail.com | 123456 |

---

## 🎯 Quick Test Scenarios

### Scenario 1: Admin Creates Project (3 min)
1. Login: http://localhost:3000
   - Email: liza@gmail.com
   - Password: 123456

2. Click "⚙️ Admin Dashboard"

3. Navigate to "📁 Projects" section

4. Click "+ New Project"

5. Fill in:
   - Project Name: "Website Redesign"
   - Priority: "High"
   - Deadline: Pick a date
   - Click "Save Project"

✅ Project created!

---

### Scenario 2: Admin Creates Client & Assigns Project (5 min)
1. In Admin Dashboard, go to "📁 Projects"

2. Create new project:
   - Name: "Logo Design"
   - Select a Client (or create in Clients section first)

3. Assign to team member in "👥 Users & Roles" section

✅ Project assigned!

---

### Scenario 3: Create & Approve Deliverable (5 min)
1. Admin creates deliverable via API:
```bash
curl -X POST http://localhost:3000/api/approvals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "title": "Homepage Mockup",
    "description": "Initial design mockup",
    "dueDate": "2025-12-15"
  }'
```

2. Client logs in to portal:
   - Go to http://localhost:3000/client
   - Click "📋 Deliverables"
   - Click on deliverable
   - Add approval notes
   - Click "✓ Approve"

✅ Deliverable approved!

---

### Scenario 4: Send Message & Check Notifications (3 min)
1. Admin goes to "/admin" dashboard

2. Go to "✅ Tasks" section

3. Assign task to team member

4. Team member gets notification:
   - Bell icon 🔔 shows badge with count
   - Click to open notifications panel

5. Go to "💬 Messages" section

6. Select a project

7. Type and send message

8. Other users see notification

✅ Communication working!

---

## 📊 Dashboard Overview

### Admin Dashboard (http://localhost:3000/admin)
```
Sections:
├── 📊 Overview - Stats and storage usage
├── 📁 Projects - Create/edit/delete projects
├── 👥 Users & Roles - Manage users and assign roles
├── ✅ Tasks - View and filter tasks
└── 📋 Logs - Backup and audit logs
```

### Client Portal (http://localhost:3000/client)
```
Sections:
├── 📁 My Projects - View assigned projects
├── 📋 Deliverables - Approve/reject work
├── 💬 Messages - Team communication
└── 💰 Invoices - Payment tracking
```

---

## 🔌 API Quick Reference

### Get Token (Login)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "liza@gmail.com",
    "password": "123456"
  }'
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Project",
    "priority": "high",
    "deadline": "2026-03-31"
  }'
```

### Get Projects
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>"
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "title": "Design homepage",
    "priority": "high"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/communications/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "content": "Great progress!"
  }'
```

---

## 🎮 UI Buttons & Features

### In Admin Dashboard

**Overview Section:**
- 📊 Chart showing storage usage
- 4 stat cards (Projects, Users, Tasks, Storage)

**Projects Section:**
- ➕ "+ New Project" button
- Table with Edit/Delete actions
- Status badges (color-coded)
- Progress bars

**Users & Roles Section:**
- Pending approvals table
- Role dropdown for each user
- Delete buttons
- Status filters

**Tasks Section:**
- Status filter dropdown
- Task list with priority colors
- Due date tracking
- Assignment info

**Logs Section:**
- Backup logs table
- Audit logs table
- Timestamps and details

---

## 🛠️ Common Tasks

### Create New User
1. Go to Admin Dashboard
2. User registers at /register
3. Go to "👥 Users & Roles" → "Pending Approvals"
4. Click "✓ Approve" button
5. User can now login

### Change User Role
1. Admin Dashboard → "👥 Users & Roles"
2. Find user in "Registered Users" table
3. Click role dropdown (Admin, Manager, Team Member, Client, Guest)
4. Selection saves automatically
5. User's permissions update

### View Project Progress
1. Admin Dashboard → "📁 Projects"
2. See "Progress" column with percentage
3. Visual progress bar shows status
4. Color-coded status badge

### Approve Deliverable (Client)
1. Login to client portal (/client)
2. Click "📋 Deliverables"
3. Click "View Details" on pending item
4. Add approval notes (optional)
5. Click "✓ Approve" or "✕ Reject"

### Send Project Message
1. Go to Client Portal or Dashboard
2. Find "💬 Messages" section
3. Select a project from list
4. Type message in input area
5. Click "Send Message"
6. Message appears in thread

---

## 🔐 Security Notes

- All passwords hashed with bcryptjs
- JWT tokens expire (configure in env.js)
- Role-based access control enforced
- All endpoints require authentication
- SQL injection protection via parameterized queries
- XSS protection via HTML escaping

---

## 📱 Mobile Access

The system is fully responsive:
- **Desktop:** Full features at 1920px+
- **Tablet:** Adjusted layout at 768px+
- **Mobile:** Touch-friendly at 375px+

To test on mobile:
1. On your phone, visit: `http://<your-computer-ip>:3000`
2. Replace `<your-computer-ip>` with your computer's local IP
3. All features work on mobile

---

## 🆘 Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in backend/config/env.js
```

### Database Errors
```bash
# Reset database
rm backend/data.db

# Restart server
npm start
```

### Can't Login
- Clear browser cache and localStorage
- Check email/password are correct
- Verify user status is "approved"
- Check browser console for errors

### Messages Not Showing
- Refresh page
- Check both users have access to project
- Verify authentication token is valid

### Notifications Not Appearing
- Click bell icon 🔔 to open panel
- Refresh page if needed
- Check browser console for errors

---

## 📚 File Locations

| Component | Location |
|-----------|----------|
| Database | backend/data.db |
| Environment | backend/config/env.js |
| Routes | backend/routes/*.js |
| Frontend | frontend/*.html |
| Styles | frontend/css/*.css |
| Scripts | frontend/js/*.js |

---

## 🚦 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

---

## 🎓 Learning Path

1. **Start with Admin Dashboard** (5 min)
   - Create a project
   - Create a task
   - Change user roles

2. **Try Client Portal** (5 min)
   - View projects
   - Approve deliverable
   - Send messages

3. **Use API Directly** (5 min)
   - Get token
   - Create resources
   - Check responses

4. **Read Documentation** (10 min)
   - PHASE_1_IMPLEMENTATION.md
   - PHASE_2_IMPLEMENTATION.md
   - SYSTEM_SUMMARY.md

---

## 🎯 What's Ready

✅ Project Management (Phase 1)
- Create/edit/delete projects
- Manage team assignments
- Track progress

✅ Task Tracking (Phase 1)
- Create tasks
- Assign to team
- Track status
- Kanban board

✅ Role Management (Phase 1)
- 5 role tiers
- Permission control
- Role assignment

✅ Client Portal (Phase 2)
- Project visibility
- Deliverable approvals
- Messaging
- Invoices

✅ Notifications (Phase 2)
- Real-time alerts
- Notification panel
- Unread tracking

📋 Coming Soon (Phase 3)
- Invoice generation
- Payment tracking
- Financial reports

---

## 💡 Pro Tips

1. **Use Admin Dashboard** for management
2. **Use Client Portal** to test client experience
3. **Check console** (F12) for API errors
4. **Test with multiple browsers** for compatibility
5. **Reset database** if you get stuck
6. **Read error messages** carefully

---

## 📞 Quick Help

### Need a fresh start?
```bash
# Delete database
rm backend/data.db

# Restart server
npm start

# Login with: liza@gmail.com / 123456
```

### Want to test with test user?
1. Go to /register
2. Create new user
3. Go to admin dashboard
4. Approve user in "Pending Approvals"
5. New user can now login

### Want to understand the code?
1. Start with server.js (routing)
2. Check routes/*.js (endpoints)
3. Check frontend/js/*.js (UI logic)
4. Read documentation files

---

**You're ready to go!** 🎉

Start by logging in with:
- Email: liza@gmail.com
- Password: 123456

Happy building! 🚀
