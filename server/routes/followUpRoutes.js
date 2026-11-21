const express = require('express');
const { body } = require('express-validator');
const {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp
} = require('../controllers/followUpController');
const authenticateToken = require('../middleware/auth');
const validateRequest = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

const createFollowUpValidationRules = [
  body('customerId')
    .notEmpty()
    .withMessage('Customer is required.')
    .isInt()
    .withMessage('Valid customer ID is required.'),
  body('followUpDate')
    .notEmpty()
    .withMessage('Follow-up date is required.')
    .isISO8601()
    .withMessage('Enter a valid date.')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const valStr = value.split('T')[0];
      if (valStr < todayStr) {
        throw new Error('Follow-up date cannot be earlier than today.');
      }
      return true;
    }),
  body('followUpType')
    .optional()
    .isIn(['Call', 'Email', 'Meeting', 'Demo'])
    .withMessage('Invalid follow-up type.')
];

// GET /api/followups
router.get('/', getFollowUps);

// GET /api/followups/:id
router.get('/:id', getFollowUpById);

// POST /api/followups
router.post(
  '/',
  [...createFollowUpValidationRules, validateRequest],
  createFollowUp
);

// PUT /api/followups/:id
router.put('/:id', updateFollowUp);

// PUT /api/followups/:id/complete
router.put('/:id/complete', completeFollowUp);

// DELETE /api/followups/:id
router.delete('/:id', deleteFollowUp);

module.exports = router;
