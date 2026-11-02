const express = require('express');
const db = require('../db/database');

const router = express.Router();

// GET /api/projects -> returns all projects as JSON
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json(projects);
});

module.exports = router;