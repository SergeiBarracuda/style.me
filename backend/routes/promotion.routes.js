const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const promotionController = require('../controllers/promotion.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   POST api/promotions
// @desc    Create a new promotion
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    adminAuth,
    check('code', 'Promotion code is required').not().isEmpty(),
    check('name', 'Promotion name is required').not().isEmpty(),
    check('type', 'Promotion type is required').isIn([
      'percentage',
      'fixed_amount',
      'free_service',
      'reduced_commission'
    ]),
    check('value', 'Value must be a positive number').isFloat({ min: 0 }),
    check('targetType', 'Target type is required').isIn([
      'all',
      'new_users',
      'new_providers',
      'specific_users',
      'loyalty_tier'
    ]),
    check('startDate', 'Start date is required').isISO8601(),
    check('endDate', 'End date is required').isISO8601()
  ],
  promotionController.createPromotion
);

// @route   GET api/promotions
// @desc    Get all promotions
// @access  Private/Admin
router.get('/', [auth, adminAuth], promotionController.getAllPromotions);

// @route   GET api/promotions/available
// @desc    Get available promotions for current user
// @access  Private
router.get('/available', auth, promotionController.getAvailablePromotions);

// @route   GET api/promotions/code/:code
// @desc    Get promotion by code
// @access  Public
router.get('/code/:code', promotionController.getPromotionByCode);

// @route   POST api/promotions/validate
// @desc    Validate promotion for user
// @access  Private
router.post(
  '/validate',
  [
    auth,
    check('code', 'Promotion code is required').not().isEmpty(),
    check('amount', 'Amount is required').isFloat({ min: 0 })
  ],
  promotionController.validatePromotion
);

// @route   POST api/promotions/apply
// @desc    Apply promotion (record usage)
// @access  Private
router.post(
  '/apply',
  [
    auth,
    check('code', 'Promotion code is required').not().isEmpty(),
    check('amount', 'Amount is required').isFloat({ min: 0 }),
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  promotionController.applyPromotion
);

// @route   GET api/promotions/:id/stats
// @desc    Get promotion statistics
// @access  Private/Admin
router.get('/:id/stats', [auth, adminAuth], promotionController.getPromotionStats);

// @route   PUT api/promotions/:id
// @desc    Update promotion
// @access  Private/Admin
router.put('/:id', [auth, adminAuth], promotionController.updatePromotion);

// @route   DELETE api/promotions/:id
// @desc    Delete promotion
// @access  Private/Admin
router.delete('/:id', [auth, adminAuth], promotionController.deletePromotion);

module.exports = router;
