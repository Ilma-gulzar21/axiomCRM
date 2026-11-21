const express = require('express');
const { body } = require('express-validator');
const {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
} = require('../controllers/opportunityController');
const authenticateToken = require('../middleware/auth');
const validateRequest = require('../middleware/validate');

const router = express.Router();

// All opportunity routes require authentication
router.use(authenticateToken);

const opportunityValidationRules = [
  body('opportunityName')
    .trim()
    .notEmpty()
    .withMessage('Opportunity Name is required.'),
  body('customerId')
    .notEmpty()
    .withMessage('Customer is required.')
    .isInt()
    .withMessage('Valid customer ID is required.'),
  body('amount')
    .notEmpty()
    .withMessage('Opportunity Amount must be greater than 0.')
    .isFloat({ gt: 0 })
    .withMessage('Opportunity Amount must be greater than 0.'),
  body('probability')
    .notEmpty()
    .withMessage('Probability must be between 0 and 100.')
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100.'),
  body('expectedCloseDate')
    .notEmpty()
    .withMessage('Expected Close Date is required.')
    .isISO8601()
    .withMessage('Enter a valid date.')
    .custom((value, { req }) => {
      if (req.body.status !== 'Closed') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Compare date part only
        const todayStr = today.toISOString().split('T')[0];
        const valStr = value.split('T')[0];
        if (valStr < todayStr) {
          throw new Error('Expected Close Date cannot be in the past.');
        }
      }
      return true;
    }),
  body('stage')
    .optional()
    .isIn(['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'])
    .withMessage('Invalid stage.')
];

// GET /api/opportunities
router.get('/', getOpportunities);

// GET /api/opportunities/:id
router.get('/:id', getOpportunityById);

// POST /api/opportunities
router.post(
  '/',
  [...opportunityValidationRules, validateRequest],
  createOpportunity
);

// PUT /api/opportunities/:id
router.put(
  '/:id',
  [...opportunityValidationRules, validateRequest],
  updateOpportunity
);

// DELETE /api/opportunities/:id
router.delete('/:id', deleteOpportunity);

module.exports = router;
