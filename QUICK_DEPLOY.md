# Quick Deployment Checklist

## 5-Minute Setup (Local Development)

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```
⏱️ Time: 2-3 minutes

### Step 2: Start Backend
```bash
npm start
```
✅ Server running on http://localhost:3000

### Step 3: Open Frontend
```
Visit: http://localhost:3000
```

### Step 4: Test Application
1. Register account
2. Login
3. Upload file
4. Check dashboard

✅ **Deployment Complete!**

---

## Production Checklist (30 mins)

- [ ] **Backend Setup**
  - [ ] Install Node.js v18+
  - [ ] Clone/upload project
  - [ ] Run `npm install --production`
  - [ ] Create `.env` file with production settings
  - [ ] Initialize database
  - [ ] Start with PM2 or systemd

- [ ] **Frontend Setup**
  - [ ] Update API_URL in config.js to production domain
  - [ ] Minify CSS/JS (optional)
  - [ ] Verify all files in place

- [ ] **Reverse Proxy**
  - [ ] Install Nginx or Apache
  - [ ] Configure to forward to Node.js:3000
  - [ ] Enable HTTPS with SSL cert

- [ ] **Database**
  - [ ] Move to secure location: `/var/lib/creative-studio/`
  - [ ] Set proper permissions
  - [ ] Test backup/restore

- [ ] **Security**
  - [ ] Set strong JWT_SECRET (32+ chars)
  - [ ] Enable CORS with specific origins
  - [ ] Setup firewall rules
  - [ ] Configure fail2ban (optional)

- [ ] **Monitoring**
  - [ ] Setup log rotation
  - [ ] Enable PM2 monitoring
  - [ ] Setup uptime monitoring (e.g., Uptime Robot)

- [ ] **Testing**
  - [ ] Test user registration
  - [ ] Test file upload
  - [ ] Test backup creation
  - [ ] Test all dashboard features
  - [ ] Check admin panel

---

## Deployment Command Reference

### Windows

```batch
# Start backend
cd backend
npm install
npm start

# Frontend accessible at
http://localhost:3000
```

### Linux/Mac

```bash
# Start backend
cd backend
npm install
npm start &

# With PM2 (recommended)
npm install -g pm2
pm2 start backend/server.js --name "creative-studio"
pm2 save

# Check status
pm2 status
pm2 logs
```

---

## Environment Variables (.env)

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_32_character_secret_key_here
DB_PATH=./creative_studio.db
UPLOAD_LIMIT=500MB
```

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| npm packages missing | `rm -rf node_modules package-lock.json` then `npm install` |
| Database error | Delete `creative_studio.db` (will recreate) |
| API not responding | Check backend is running: `curl http://localhost:3000/api/health` |
| Frontend blank page | Check browser console for errors, verify API_URL in config.js |

---

## Important Files

```
creative-studio-system/
├── backend/
│   ├── server.js (main)
│   ├── package.json (dependencies)
│   ├── .env (configuration)
│   └── creative_studio.db (database)
├── frontend/
│   ├── index.html (login page)
│   ├── dashboard.html (user dashboard)
│   ├── css/ (styling)
│   └── js/ (scripts)
└── DEPLOYMENT_GUIDE.md (detailed)
```

---

## Useful Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Install specific package
npm install package-name

# Update all packages
npm update

# Check for security issues
npm audit

# Clean cache
npm cache clean --force

# Stop Node.js process
kill $(lsof -t -i:3000)
```

---

## Support Quick Links

- 📖 Full Guide: See `DEPLOYMENT_GUIDE.md`
- 🐛 Issues: Check browser console & backend logs
- 📊 Status: Visit `http://localhost:3000/api/health`
- 💾 Database: Backup location: `./creative_studio.db`

---

**Ready to deploy? Start with Step 1 above!**
