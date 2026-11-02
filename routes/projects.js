const express = require('express');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Checks the data sent from the browser. Returns an error message or null.
function validate(body) {
  const { title, description, tech, live_url, code_url } = body;

  if (!title || !description || !tech) {
    return 'Title, description and tech are required.';
  }
  if (title.length > 100 || tech.length > 200 || description.length > 1000) {
    return 'One of the fields is too long.';
  }
  for (const url of [live_url, code_url]) {
    if (url && !/^https?:\/\//i.test(url)) {
      return 'Links must start with http:// or https://';
    }
  }
  return null;
}

// GET /api/projects -> public, anyone can view
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json(projects);
});

// POST /api/projects -> admin only, add a project
router.post('/', requireAuth, (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { title, description, tech, live_url, code_url } = req.body;
  const result = db.prepare(
    'INSERT INTO projects (title, description, tech, live_url, code_url) VALUES (?, ?, ?, ?, ?)'
  ).run(title.trim(), description.trim(), tech.trim(), live_url || '', code_url || '');

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/projects/:id -> admin only, edit a project
router.put('/:id', requireAuth, (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { title, description, tech, live_url, code_url } = req.body;
  const result = db.prepare(
    'UPDATE projects SET title = ?, description = ?, tech = ?, live_url = ?, code_url = ? WHERE id = ?'
  ).run(title.trim(), description.trim(), tech.trim(), live_url || '', code_url || '', req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  res.json({ success: true });
});

// DELETE /api/projects/:id -> admin only, delete a project
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  res.json({ success: true });
});

module.exports = router;