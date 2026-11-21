const express = require('express');
const {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  unlockUser
} = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

// Admin-only access for User Management
router.use(authenticateToken);
router.use(requireRole(['Admin']));

// GET /api/users
router.get('/', getUsers);

// PUT /api/users/:id/role
router.put('/:id/role', updateUserRole);

// PUT /api/users/:id/status
router.put('/:id/status', toggleUserStatus);

// PUT /api/users/:id/unlock
router.put('/:id/unlock', unlockUser);

module.exports = router;
