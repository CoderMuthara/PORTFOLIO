const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const validUser = username === process.env.ADMIN_USERNAME;
  const validPassword = bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH);

  if (!validUser || !validPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '2h' });

  res.cookie('token', token, {
    httpOnly: true,      // JavaScript in the browser can't read it
    sameSite: 'strict',  // helps block cross-site attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only when deployed
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });

  res.json({ success: true });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// GET /api/auth/check -> tells the page if you're logged in
router.get('/check', requireAuth, (req, res) => {
  res.json({ loggedIn: true });
});

module.exports = router;