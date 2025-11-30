const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, './data.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(backups)", (err, columns) => {
  console.log('Backups table columns:');
  columns.forEach(col => {
    console.log(`  ${col.name}: ${col.type}`);
  });
  db.close();
});
