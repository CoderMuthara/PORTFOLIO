const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// A certificate can be an image or a PDF
const allowedTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString('hex') + allowedTypes[file.mimetype])
  }),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (allowedTypes[file.mimetype]) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP or PDF files are allowed.'));
  }
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File must be under 3 MB.' : err.message;
      return res.status(400).json({ error: message });
    }
    next();
  });
}

function removeFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, path.basename(filename)), () => {});
}

// A real PDF starts with "%PDF-" (the name alone can be faked)
function looksLikePdf(filename) {
  try {
    const fd = fs.openSync(path.join(uploadDir, filename), 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString() === '%PDF-';
  } catch (error) {
    return false;
  }
}

// Returns an error message or null
function validate(body, file) {
  const { title, issuer, issued, credential_url } = body;

  if (!title || !title.trim() || !issuer || !issuer.trim()) {
    return 'Title and issuer are required.';
  }
  if (title.length > 150 || issuer.length > 80) {
    return 'Title or issuer is too long.';
  }
  if (issued && !/^\d{4}-\d{2}$/.test(issued)) {
    return 'Date must be a month and year.';
  }
  if (credential_url && !/^https?:\/\//i.test(credential_url)) {
    return 'The verification link must start with http:// or https://';
  }
  if (file && file.filename.endsWith('.pdf') && !looksLikePdf(file.filename)) {
    return 'That file is not a valid PDF.';
  }
  return null;
}

// GET /api/certifications -> public
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM certifications ORDER BY issued DESC, id DESC').all());
});

// POST /api/certifications -> admin only
router.post('/', requireAuth, handleUpload, (req, res) => {
  const error = validate(req.body, req.file);
  if (error) {
    if (req.file) removeFile(req.file.filename);
    return res.status(400).json({ error });
  }

  const { title, issuer, issued, credential_url } = req.body;
  const result = db.prepare(
    'INSERT INTO certifications (title, issuer, issued, credential_url, file) VALUES (?, ?, ?, ?, ?)'
  ).run(title.trim(), issuer.trim(), issued || '', credential_url || '', req.file ? req.file.filename : '');

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/certifications/:id -> admin only
router.put('/:id', requireAuth, handleUpload, (req, res) => {
  const error = validate(req.body, req.file);
  if (error) {
    if (req.file) removeFile(req.file.filename);
    return res.status(400).json({ error });
  }

  const existing = db.prepare('SELECT file FROM certifications WHERE id = ?').get(req.params.id);
  if (!existing) {
    if (req.file) removeFile(req.file.filename);
    return res.status(404).json({ error: 'Certification not found.' });
  }

  // Keep the old file unless a new one was uploaded
  let file = existing.file;
  if (req.file) {
    removeFile(existing.file);
    file = req.file.filename;
  }

  const { title, issuer, issued, credential_url } = req.body;
  db.prepare(
    'UPDATE certifications SET title = ?, issuer = ?, issued = ?, credential_url = ?, file = ? WHERE id = ?'
  ).run(title.trim(), issuer.trim(), issued || '', credential_url || '', file, req.params.id);

  res.json({ success: true });
});

// DELETE /api/certifications/:id -> admin only
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT file FROM certifications WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Certification not found.' });
  }

  db.prepare('DELETE FROM certifications WHERE id = ?').run(req.params.id);
  removeFile(existing.file);
  res.json({ success: true });
});

module.exports = router;