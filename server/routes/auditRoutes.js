const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

// Admin-only access for Audit Logs
router.use(authenticateToken);
router.use(requireRole(['Admin']));

// GET /api/audit
router.get('/', getAuditLogs);

module.exports = router;
