const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { googleSignIn } = require('../controllers/googleAuthController');

router.post('/register', register);
router.post('/login', login);
router.post('/google-signin', googleSignIn);

module.exports = router;
