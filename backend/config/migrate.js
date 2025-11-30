const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database for migration');
    migrateDatabase();
  }
});

function migrateDatabase() {
  // Check if backups table has fileName column, if not add it
  db.all("PRAGMA table_info(backups)", (err, columns) => {
    if (err) {
      console.error('Error checking table structure:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);
    const missingColumns = [];

    if (!columnNames.includes('fileName')) missingColumns.push('fileName TEXT');
    if (!columnNames.includes('fileSize')) missingColumns.push('fileSize INTEGER');

    if (missingColumns.length === 0) {
      console.log('Backups table already has all required columns');
      db.close();
      return;
    }

    console.log('Adding missing columns to backups table:', missingColumns.join(', '));
    
    missingColumns.forEach(column => {
      db.run(`ALTER TABLE backups ADD COLUMN ${column}`, (err) => {
        if (err) {
          console.error('Error adding column:', err);
        } else {
          console.log(`Added column: ${column}`);
        }
      });
    });

    setTimeout(() => {
      console.log('Migration complete');
      db.close();
    }, 1000);
  });
}
