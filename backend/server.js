const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');
const config = require('./config/env');

// Create necessary directories
const dirs = ['./uploads', './backups'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// Middleware - with larger file size limits
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// API Routes MUST come before static files
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/backups', require('./routes/backups'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve frontend (basic routing)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin_dashboard.html'));
});

app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/client_portal.html'));
});

app.get('/financial', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/financial_dashboard.html'));
});

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend')));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/files/upload');
  console.log('  GET /api/files/list');
  console.log('  GET /api/files/download/:id');
  console.log('  DELETE /api/files/:id');
  console.log('  GET /api/backups/history');
  console.log('  POST /api/backups/file/:id');
  console.log('  GET /api/backups/admin/history');
  console.log('  GET /api/admin/pending-users');
  console.log('  POST /api/admin/approve-user');
  console.log('  POST /api/admin/reject-user');
  console.log('  GET /api/admin/all-users');
  console.log('  POST /api/admin/delete-user');
  console.log('  GET /api/admin/backup-logs');
  console.log('  GET /api/admin/audit-logs');
});

// Handle port already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close the other process or use a different port.`);
    process.exit(1);
  }
});
