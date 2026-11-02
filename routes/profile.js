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

// Builds an uploader that only accepts the given file types
function makeUploader(allowedTypes, maxBytes, wrongTypeMessage) {
  return multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      // Random file name, so nobody can overwrite or guess other files
      filename: (req, file, cb) =>
        cb(null, crypto.randomBytes(16).toString('hex') + allowedTypes[file.mimetype])
    }),
    limits: { fileSize: maxBytes },
    fileFilter: (req, file, cb) => {
      if (allowedTypes[file.mimetype]) cb(null, true);
      else cb(new Error(wrongTypeMessage));
    }
  });
}

const photoUploader = makeUploader(
  { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' },
  2 * 1024 * 1024,
  'Only JPG, PNG or WebP images are allowed.'
);

const cvUploader = makeUploader(
  { 'application/pdf': '.pdf' },
  3 * 1024 * 1024,
  'Only PDF files are allowed.'
);

// Runs an upload and turns upload errors into clean JSON messages
function handleUpload(uploader, field, missingMessage, tooBigMessage) {
  return (req, res, next) => {
    uploader.single(field)(req, res, (err) => {
      if (err) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? tooBigMessage : err.message;
        return res.status(400).json({ error: message });
      }
      if (!req.file) {
        return res.status(400).json({ error: missingMessage });
      }
      next();
    });
  };
}

// ---------- Helpers ----------
function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : '';
}

function setSetting(key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ' +
    'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

function removeFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, path.basename(filename)), () => {});
}

// A real PDF file starts with "%PDF-" (the name alone can be faked)
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

// ---------- Routes ----------

// GET /api/profile -> public
router.get('/', (req, res) => {
  res.json({ photo: getSetting('photo'), cv: getSetting('cv') });
});

// POST /api/profile/photo -> admin only
router.post('/photo', requireAuth,
  handleUpload(photoUploader, 'photo', 'Please choose a photo.', 'Photo must be under 2 MB.'),
  (req, res) => {
    const old = getSetting('photo');
    setSetting('photo', req.file.filename);
    removeFile(old);
    res.json({ photo: req.file.filename });
  }
);

// DELETE /api/profile/photo -> admin only
router.delete('/photo', requireAuth, (req, res) => {
  removeFile(getSetting('photo'));
  db.prepare("DELETE FROM settings WHERE key = 'photo'").run();
  res.json({ success: true });
});

// POST /api/profile/cv -> admin only
router.post('/cv', requireAuth,
  handleUpload(cvUploader, 'cv', 'Please choose a PDF.', 'CV must be under 3 MB.'),
  (req, res) => {
    if (!looksLikePdf(req.file.filename)) {
      removeFile(req.file.filename);
      return res.status(400).json({ error: 'That file is not a valid PDF.' });
    }

    const old = getSetting('cv');
    setSetting('cv', req.file.filename);
    removeFile(old);
    res.json({ cv: req.file.filename });
  }
);

// DELETE /api/profile/cv -> admin only
router.delete('/cv', requireAuth, (req, res) => {
  removeFile(getSetting('cv'));
  db.prepare("DELETE FROM settings WHERE key = 'cv'").run();
  res.json({ success: true });
});

module.exports = router;