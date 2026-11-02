const express = require('express');
const db = require('../db/database');

const router = express.Router();

// POST /api/contact -> saves a new message
router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message is too long.' });
  }

  db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim(), message.trim());

  res.status(201).json({ success: true });
});

module.exports = router;