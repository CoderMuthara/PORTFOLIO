const Database = require('better-sqlite3');
const path = require('path');

// This creates portfolio.db if it doesn't exist yet
const db = new Database(path.join(__dirname, 'portfolio.db'));

// Create the projects table (only runs if it doesn't exist)
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tech TEXT NOT NULL,
    live_url TEXT,
    code_url TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


// Add the phone column if it isn't there yet
const messageColumns = db.prepare('PRAGMA table_info(messages)').all();
if (!messageColumns.some(column => column.name === 'phone')) {
  db.exec("ALTER TABLE messages ADD COLUMN phone TEXT DEFAULT ''");
}

// Add the image column if it isn't there yet
const projectColumns = db.prepare('PRAGMA table_info(projects)').all();
if (!projectColumns.some(column => column.name === 'image')) {
  db.exec("ALTER TABLE projects ADD COLUMN image TEXT DEFAULT ''");
}

// Add the category column if it isn't there yet
const categoryColumns = db.prepare('PRAGMA table_info(projects)').all();
if (!categoryColumns.some(column => column.name === 'category')) {
  db.exec("ALTER TABLE projects ADD COLUMN category TEXT DEFAULT ''");
}
// Add sample data only if the table is empty
const count = db.prepare('SELECT COUNT(*) AS total FROM projects').get().total;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO projects (title, description, tech, live_url, code_url) VALUES (?, ?, ?, ?, ?)'
  );
  insert.run('Sample Project 1', 'A short description of what this project does.', 'HTML, CSS, JavaScript', '#', '#');
  insert.run('Sample Project 2', 'Another project description goes here.', 'Node.js, Express, SQLite', '#', '#');
}

module.exports = db;