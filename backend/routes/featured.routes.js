const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const featuredController = require('../controllers/featured.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   GET api/featured
// @desc    Get featured providers (Public)
// @access  Public
router.get('/', featuredController.getFeaturedProviders);

// @route   GET api/featured/my-status
// @desc    Get provider's featured status and recommendations
// @access  Private/Provider
router.get('/my-status', auth, featuredController.getProviderFeaturedStatus);

// @route   GET api/featured/rankings
// @desc    Get featured provider rankings
// @access  Private/Admin
router.get('/rankings', [auth, adminAuth], featuredController.getRankings);

// @route   POST api/featured/update-scores/:providerId
// @desc    Update provider's featured scores
// @access  Private/Admin
router.post('/update-scores/:providerId', [auth, adminAuth], featuredController.updateProviderScores);

// @route   POST api/featured/manual-feature
// @desc    Manually feature a provider
// @access  Private/Admin
router.post(
  '/manual-feature',
  [
    auth,
    adminAuth,
    check('providerId', 'Provider ID is required').not().isEmpty(),
    check('duration', 'Duration in days is required').isInt({ min: 1 })
  ],
  featuredController.manuallyFeatureProvider
);

// @route   POST api/featured/promote
// @desc    Promote a provider (paid promotion)
// @access  Private/Admin
router.post(
  '/promote',
  [
    auth,
    adminAuth,
    check('providerId', 'Provider ID is required').not().isEmpty(),
    check('duration', 'Duration in days is required').isInt({ min: 1 }),
    check('priority', 'Priority is required').isInt({ min: 1, max: 10 })
  ],
  featuredController.promoteProvider
);

// @route   DELETE api/featured/:providerId
// @desc    Remove featured status
// @access  Private/Admin
router.delete('/:providerId', [auth, adminAuth], featuredController.removeFeaturedStatus);

// @route   POST api/featured/:providerId/click
// @desc    Track provider click from featured listing
// @access  Public
router.post('/:providerId/click', featuredController.trackClick);

// @route   POST api/featured/:providerId/booking
// @desc    Track booking from featured listing
// @access  Private
router.post('/:providerId/booking', auth, featuredController.trackBooking);

// @route   POST api/featured/bulk-update
// @desc    Bulk update all provider scores
// @access  Private/Admin
router.post('/bulk-update', [auth, adminAuth], featuredController.bulkUpdateScores);

module.exports = router;
