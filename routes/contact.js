const express = require('express');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/contact -> public, visitors send a message
router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email.' });
  }
  if (name.length > 100 || email.length > 200 || message.length > 2000) {
    return res.status(400).json({ error: 'One of the fields is too long.' });
  }

  db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim(), message.trim());

  res.status(201).json({ success: true });
});

// GET /api/contact -> admin only, read all messages
router.get('/', requireAuth, (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
  res.json(messages);
});

// DELETE /api/contact/:id -> admin only, delete a message
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Message not found.' });
  }
  res.json({ success: true });
});

module.exports = router;