const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { uploadFile, getUserFiles, downloadFile, deleteFile, getStorageStats } = require('../controllers/fileController');

// Configure multer
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

router.post('/upload', verifyToken, upload.single('file'), uploadFile);
router.get('/list', verifyToken, getUserFiles);
router.get('/download/:id', verifyToken, downloadFile);
router.delete('/:id', verifyToken, deleteFile);
router.get('/stats/storage', verifyToken, getStorageStats);

module.exports = router;
