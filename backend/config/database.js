const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      googleId TEXT UNIQUE,
      profilePic TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      bio TEXT,
      role TEXT DEFAULT 'team-member',
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    // Create admin user if doesn't exist
    db.get('SELECT * FROM users WHERE email = ?', ['liza@gmail.com'], (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync('123456', 10);
        db.run(
          'INSERT INTO users (username, email, password, status) VALUES (?, ?, ?, ?)',
          ['Liza', 'liza@gmail.com', hashedPassword, 'approved'],
          () => console.log('Admin user created: Liza (liza@gmail.com)')
        );
      }
    });
  });

  // Files table
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      filePath TEXT NOT NULL,
      uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Backups table
  db.run(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      fileId INTEGER,
      fileName TEXT NOT NULL,
      backupPath TEXT NOT NULL,
      fileSize INTEGER,
      status TEXT DEFAULT 'completed',
      completedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE
    )
  `);

  // Migrate existing backups table if needed
  db.run(`
    PRAGMA table_info(backups)
  `, (err, info) => {
    if (!err && info) {
      const hasFileName = info.some(col => col.name === 'fileName');
      if (!hasFileName) {
        db.run(`ALTER TABLE backups ADD COLUMN fileName TEXT NOT NULL DEFAULT 'backup'`);
      }
    }
  });

  // Audit logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS auditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Clients table
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      company TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'planning',
      priority TEXT DEFAULT 'medium',
      startDate DATE,
      deadline DATE,
      budget REAL,
      spent REAL DEFAULT 0,
      assignedTo INTEGER,
      createdBy INTEGER,
      progress INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (assignedTo) REFERENCES users(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assignedTo INTEGER,
      dueDate DATE,
      estimatedHours REAL,
      completedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignedTo) REFERENCES users(id)
    )
  `);

  // Invoices table
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER,
      clientId INTEGER NOT NULL,
      invoiceNumber TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      issueDate DATE,
      dueDate DATE,
      paidDate DATE,
      description TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Messages/Communications table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER NOT NULL,
      recipientId INTEGER,
      projectId INTEGER,
      clientId INTEGER,
      subject TEXT,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'message',
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users(id),
      FOREIGN KEY (recipientId) REFERENCES users(id),
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      relatedId INTEGER,
      relatedType TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Deliverables table for client approvals
  db.run(`
    CREATE TABLE IF NOT EXISTS deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      dueDate DATE,
      expectedDeliveryDate DATE,
      submissionDate DATETIME,
      submissionNotes TEXT,
      approvalDate DATETIME,
      approvalNotes TEXT,
      rejectionDate DATETIME,
      rejectionReason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Invoices table (Phase 3)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER,
      clientId INTEGER NOT NULL,
      invoiceNumber TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      issueDate DATE,
      dueDate DATE,
      paidDate DATE,
      description TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Expenses table (Phase 3)
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      expenseDate DATE,
      vendor TEXT,
      notes TEXT,
      status TEXT DEFAULT 'recorded',
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Payments table (Phase 3)
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      amount REAL NOT NULL,
      paymentMethod TEXT,
      status TEXT DEFAULT 'pending',
      paymentDate DATE,
      confirmationNumber TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  // Financial Reports table (Phase 3)
  db.run(`
    CREATE TABLE IF NOT EXISTS financialReports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportType TEXT NOT NULL,
      period TEXT,
      startDate DATE,
      endDate DATE,
      totalRevenue REAL DEFAULT 0,
      totalExpenses REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      taxAmount REAL DEFAULT 0,
      projectCount INTEGER DEFAULT 0,
      clientCount INTEGER DEFAULT 0,
      data TEXT,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Budget Tracking table (Phase 3)
  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      budgetAmount REAL NOT NULL,
      spentAmount REAL DEFAULT 0,
      category TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
}

module.exports = db;
