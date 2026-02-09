const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register — Create new user
router.post('/register', register);

// POST /api/auth/login — Authenticate user
router.post('/login', login);

// GET /api/auth/me — Get current user profile (protected)
router.get('/me', protect, getMe);

module.exports = router;
