const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');

router.get('/', verifyToken, getProfile);
router.put('/', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
