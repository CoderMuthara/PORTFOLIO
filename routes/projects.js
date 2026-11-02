const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ---------- Image upload settings ----------
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Only these types are allowed (no SVG, which can contain scripts)
const allowedTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    // Random file name, so nobody can overwrite or guess other files
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString('hex') + allowedTypes[file.mimetype])
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (allowedTypes[file.mimetype]) cb(null, true);
    else cb(new Error('Only JPG, PNG or WebP images are allowed.'));
  }
});

// Runs the upload and turns upload errors into a clean JSON message
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 2 MB.' : err.message;
      return res.status(400).json({ error: message });
    }
    next();
  });
}

function removeFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, path.basename(filename)), () => {});
}

// Checks the text fields. Returns an error message or null.
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

// GET /api/projects -> public
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json(projects);
});

// POST /api/projects -> admin only
router.post('/', requireAuth, handleUpload, (req, res) => {
  const error = validate(req.body);
  if (error) {
    if (req.file) removeFile(req.file.filename);
    return res.status(400).json({ error });
  }

  const { title, description, tech, live_url, code_url } = req.body;
  const image = req.file ? req.file.filename : '';

  const result = db.prepare(
    'INSERT INTO projects (title, description, tech, live_url, code_url, image) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title.trim(), description.trim(), tech.trim(), live_url || '', code_url || '', image);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/projects/:id -> admin only
router.put('/:id', requireAuth, handleUpload, (req, res) => {
  const error = validate(req.body);
  if (error) {
    if (req.file) removeFile(req.file.filename);
    return res.status(400).json({ error });
  }

  const existing = db.prepare('SELECT image FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    if (req.file) removeFile(req.file.filename);
    return res.status(404).json({ error: 'Project not found.' });
  }

  // Keep the old image unless a new one was uploaded
  let image = existing.image;
  if (req.file) {
    removeFile(existing.image);
    image = req.file.filename;
  }

  const { title, description, tech, live_url, code_url } = req.body;
  db.prepare(
    'UPDATE projects SET title = ?, description = ?, tech = ?, live_url = ?, code_url = ?, image = ? WHERE id = ?'
  ).run(title.trim(), description.trim(), tech.trim(), live_url || '', code_url || '', image, req.params.id);

  res.json({ success: true });
});

// DELETE /api/projects/:id -> admin only
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT image FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  removeFile(existing.image);
  res.json({ success: true });
});

module.exports = router;