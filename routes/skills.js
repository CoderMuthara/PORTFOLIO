const express = require('express');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function validate(body) {
  const { name, category } = body;
  if (!name || !name.trim()) return 'Skill name is required.';
  if (!category || !category.trim()) return 'Category is required.';
  if (name.length > 50 || category.length > 50) return 'Name or category is too long.';
  return null;
}

// GET /api/skills -> public
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM skills ORDER BY id').all());
});

// POST /api/skills -> admin only
router.post('/', requireAuth, (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const result = db.prepare('INSERT INTO skills (name, category) VALUES (?, ?)')
    .run(req.body.name.trim(), req.body.category.trim());
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/skills/:id -> admin only
router.put('/:id', requireAuth, (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const result = db.prepare('UPDATE skills SET name = ?, category = ? WHERE id = ?')
    .run(req.body.name.trim(), req.body.category.trim(), req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Skill not found.' });
  res.json({ success: true });
});

// DELETE /api/skills/:id -> admin only
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Skill not found.' });
  res.json({ success: true });
});

module.exports = router;