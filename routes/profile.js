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

const allowedTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString('hex') + allowedTypes[file.mimetype])
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (allowedTypes[file.mimetype]) cb(null, true);
    else cb(new Error('Only JPG, PNG or WebP images are allowed.'));
  }
});

function getPhoto() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'photo'").get();
  return row ? row.value : '';
}

function removeFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, path.basename(filename)), () => {});
}

// GET /api/profile -> public
router.get('/', (req, res) => {
  res.json({ photo: getPhoto() });
});

// POST /api/profile/photo -> admin only, upload or replace the photo
router.post('/photo', requireAuth, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be under 2 MB.' : err.message;
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose a photo.' });
    }

    const oldPhoto = getPhoto();
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('photo', ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(req.file.filename);
    removeFile(oldPhoto);

    res.json({ photo: req.file.filename });
  });
});

// DELETE /api/profile/photo -> admin only, remove the photo
router.delete('/photo', requireAuth, (req, res) => {
  const oldPhoto = getPhoto();
  db.prepare("DELETE FROM settings WHERE key = 'photo'").run();
  removeFile(oldPhoto);
  res.json({ success: true });
});

module.exports = router;