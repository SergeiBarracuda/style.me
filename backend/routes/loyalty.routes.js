const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const loyaltyController = require('../controllers/loyalty.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   GET api/loyalty
// @desc    Get user's loyalty program
// @access  Private
router.get('/', auth, loyaltyController.getLoyaltyProgram);

// @route   GET api/loyalty/stats
// @desc    Get loyalty program statistics
// @access  Private
router.get('/stats', auth, loyaltyController.getLoyaltyStats);

// @route   GET api/loyalty/history
// @desc    Get points history
// @access  Private
router.get('/history', auth, loyaltyController.getPointsHistory);

// @route   GET api/loyalty/rewards
// @desc    Get available rewards
// @access  Private
router.get('/rewards', auth, loyaltyController.getAvailableRewards);

// @route   GET api/loyalty/tiers
// @desc    Get tier benefits information
// @access  Public
router.get('/tiers', loyaltyController.getTierBenefits);

// @route   GET api/loyalty/leaderboard
// @desc    Get loyalty program leaderboard
// @access  Private
router.get('/leaderboard', auth, loyaltyController.getLeaderboard);

// @route   POST api/loyalty/redeem
// @desc    Redeem points for reward
// @access  Private
router.post(
  '/redeem',
  [
    auth,
    check('points', 'Points amount is required').isInt({ min: 1 }),
    check('rewardType', 'Reward type is required').isIn([
      'discount',
      'free_service',
      'priority_booking',
      'cashback'
    ]),
    check('rewardValue', 'Reward value is required').isFloat({ min: 0 })
  ],
  loyaltyController.redeemPoints
);

// @route   POST api/loyalty/rewards/:rewardId/use
// @desc    Use a reward
// @access  Private
router.post(
  '/rewards/:rewardId/use',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  loyaltyController.useReward
);

// @route   POST api/loyalty/award
// @desc    Award points to user (Admin/System)
// @access  Private/Admin
router.post(
  '/award',
  [
    auth,
    adminAuth,
    check('userId', 'User ID is required').not().isEmpty(),
    check('amount', 'Points amount is required').isInt({ min: 1 }),
    check('reason', 'Reason is required').not().isEmpty()
  ],
  loyaltyController.awardPoints
);

// @route   POST api/loyalty/update-spending
// @desc    Update user's spending and bookings (System)
// @access  Private/Admin
router.post(
  '/update-spending',
  [
    auth,
    adminAuth,
    check('userId', 'User ID is required').not().isEmpty(),
    check('amount', 'Amount is required').isFloat({ min: 0 }),
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  loyaltyController.updateSpending
);

module.exports = router;
