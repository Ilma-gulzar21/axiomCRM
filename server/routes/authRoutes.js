const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required.')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character.'),
    validateRequest
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
    validateRequest
  ],
  login
);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', authenticateToken, getMe);

module.exports = router;
