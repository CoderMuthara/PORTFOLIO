const express = require('express');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/contact -> public, visitors send a message
// POST /api/contact -> public, visitors send a message
router.post('/', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email.' });
  }
  if (name.length > 100 || email.length > 200 || message.length > 2000) {
    return res.status(400).json({ error: 'One of the fields is too long.' });
  }

  // Phone is optional, but if given it must look like a phone number
  const cleanPhone = (phone || '').trim();
  if (cleanPhone && !/^\+?[0-9\s-]{9,15}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  db.prepare('INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.trim(), cleanPhone, message.trim());

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