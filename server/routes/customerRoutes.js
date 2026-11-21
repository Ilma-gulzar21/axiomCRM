const express = require('express');
const { body } = require('express-validator');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const authenticateToken = require('../middleware/auth');
const validateRequest = require('../middleware/validate');

const router = express.Router();

// All customer routes require authentication
router.use(authenticateToken);

const customerValidationRules = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer Name is required.')
    .isLength({ max: 100 })
    .withMessage('Customer Name cannot exceed 100 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Enter a valid phone number.')
];

// GET /api/customers
router.get('/', getCustomers);

// GET /api/customers/:id
router.get('/:id', getCustomerById);

// POST /api/customers
router.post(
  '/',
  [...customerValidationRules, validateRequest],
  createCustomer
);

// PUT /api/customers/:id
router.put(
  '/:id',
  [...customerValidationRules, validateRequest],
  updateCustomer
);

// DELETE /api/customers/:id (Soft-deactivate)
router.delete('/:id', deleteCustomer);

module.exports = router;
