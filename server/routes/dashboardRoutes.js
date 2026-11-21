const express = require('express');
const { getDashboardMetrics } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard
router.get('/', getDashboardMetrics);

module.exports = router;
