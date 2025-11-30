# CREATIVE STUDIO SYSTEM - DEPLOYMENT GUIDE

## System Requirements

- Node.js v14+ 
- npm v6+
- SQLite3
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Port 3000 available (or configure in .env)

## Pre-Deployment Checklist

- [ ] Backend dependencies installed
- [ ] Frontend assets in place
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] SSL certificates (production only)

---

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
npm install
```

### 1.2 Create Environment File

Create `.env` file in the `backend/` directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
DB_PATH=./creative_studio.db
UPLOAD_LIMIT=500MB
```

### 1.3 Initialize Database

The database will auto-initialize on first run. Tables created:
- users
- files
- backups
- auditLogs
- projects
- tasks
- roles
- clients
- communications
- notifications
- approvals
- invoices
- payments
- expenses
- financialReports

### 1.4 Start Backend Server

**Development:**
```bash
npm start
```

**With auto-reload (requires nodemon):**
```bash
npm install --save-dev nodemon
npm run dev
```

Backend will run on: `http://localhost:3000`

---

## Step 2: Frontend Setup

### 2.1 Configuration

Update `frontend/js/config.js` with your backend URL:

```javascript
const API_URL = 'http://localhost:3000/api'; // Development
// const API_URL = 'https://your-domain.com/api'; // Production
```

### 2.2 Serve Frontend

**Option A: Using Node.js HTTP Server**
```bash
cd frontend
npx http-server -p 8080
```

**Option B: Using Express (recommended)**

Add to backend `server.js`:
```javascript
app.use(express.static('../frontend'));
```

Then access at: `http://localhost:3000`

**Option C: Direct File Access**
Open `frontend/index.html` in browser (limited functionality)

---

## Step 3: Verification

### 3.1 Test Backend API

```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
# {"status":"OK"}
```

### 3.2 Test Frontend

1. Navigate to `http://localhost:3000`
2. Register a new account
3. Login with credentials
4. Upload a test file
5. Create a backup
6. Check dashboard metrics

---

## Step 4: Production Deployment

### 4.1 Environment Configuration

Update `.env` for production:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_secure_random_key_32_chars
DB_PATH=/var/lib/creative-studio/creative_studio.db
UPLOAD_LIMIT=500MB
```

### 4.2 Security Hardening

**Backend:**
- Use HTTPS (SSL/TLS certificate)
- Set secure JWT secret
- Enable CORS with specific origins
- Rate limiting on login/upload
- Input validation on all endpoints

**Frontend:**
- Minify and compress assets
- Enable caching headers
- Use Content Security Policy
- Regular security audits

### 4.3 Deployment Methods

**Method 1: Traditional Server (Ubuntu/Linux)**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone/upload project
cd /var/www/creative-studio
npm install --production

# Create systemd service
sudo nano /etc/systemd/system/creative-studio.service
```

Service file content:
```ini
[Unit]
Description=Creative Studio System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/creative-studio
ExecStart=/usr/bin/node backend/server.js
Restart=always
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable creative-studio
sudo systemctl start creative-studio
sudo systemctl status creative-studio
```

**Method 2: Docker Deployment**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "backend/server.js"]
```

Build and run:
```bash
docker build -t creative-studio .
docker run -p 3000:3000 -v $(pwd)/data:/app/data creative-studio
```

**Method 3: Heroku Deployment**

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Method 4: Cloud Platforms**

- **AWS**: Use EC2, RDS, S3
- **Google Cloud**: Cloud Run, Cloud SQL
- **Azure**: App Service, SQL Database
- **DigitalOcean**: Droplets, Spaces

### 4.4 Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Step 5: Database Backup

### 5.1 Automated Backups

Create backup script:
```bash
#!/bin/bash
BACKUP_DIR="/backups/creative-studio"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sqlite3 /var/lib/creative-studio/creative_studio.db ".backup $BACKUP_DIR/backup_$TIMESTAMP.db"
```

Schedule with cron (daily at 2 AM):
```bash
0 2 * * * /scripts/backup-db.sh
```

### 5.2 Restore from Backup

```bash
sqlite3 creative_studio.db ".restore /path/to/backup.db"
```

---

## Step 6: Monitoring & Maintenance

### 6.1 Log Files

Configure logging in backend:
```javascript
const fs = require('fs');
const logStream = fs.createWriteStream('logs/app.log', { flags: 'a' });

app.use((req, res, next) => {
  logStream.write(`${new Date().toISOString()} ${req.method} ${req.url}\n`);
  next();
});
```

### 6.2 Performance Monitoring

- Monitor CPU/Memory usage
- Track request response times
- Monitor database size
- Track storage usage

### 6.3 Regular Maintenance

- Update dependencies: `npm update`
- Check for security vulnerabilities: `npm audit`
- Rotate logs (keep last 30 days)
- Clean old backups (keep last 3 months)
- Test restore procedures

---

## Troubleshooting

### Backend Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process
kill -9 <PID>

# Check Node version
node --version

# Check npm packages
npm ls
```

### Database Errors

```bash
# Check database integrity
sqlite3 creative_studio.db "PRAGMA integrity_check;"

# Rebuild database
sqlite3 creative_studio.db "VACUUM;"
```

### Frontend Won't Load

- Clear browser cache (Ctrl+Shift+Delete)
- Check API_URL in config.js
- Verify backend is running
- Check browser console for errors

### File Upload Issues

- Check upload directory permissions
- Verify disk space available
- Check file size limits
- Verify CORS settings

---

## Performance Optimization

1. **Frontend:**
   - Minify CSS/JS
   - Compress images
   - Enable gzip compression
   - Use CDN for static assets

2. **Backend:**
   - Implement caching
   - Use connection pooling
   - Optimize database queries
   - Enable response compression

3. **Database:**
   - Add indexes on frequently queried columns
   - Archive old records
   - Regular VACUUM operations

---

## Support & Documentation

- **GitHub Issues**: Report bugs
- **Logs**: Check `/var/log/creative-studio/`
- **Database**: SQLite shell access for debugging
- **API Docs**: Available at `/api/docs` (if implemented)

---

## Version Info

- **System**: Creative Studio v1.0.0
- **Last Updated**: April 2025
- **License**: MIT (or your license)

---

## Quick Start Commands

```bash
# Development
cd backend && npm install && npm start

# Production
NODE_ENV=production npm start

# With PM2
npm install -g pm2
pm2 start backend/server.js --name "creative-studio"
pm2 save
```

---

**Deployment Complete!** Your Creative Studio System is ready for use.
