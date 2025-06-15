const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const providerController = require('../controllers/provider.controller');
const auth = require('../middleware/auth');

// @route   POST api/providers/profile
// @desc    Create provider profile
// @access  Private
router.post(
  '/profile',
  [
    auth,
    check('profession', 'Profession is required').not().isEmpty(),
    check('location.address', 'Address is required').not().isEmpty(),
    check('location.city', 'City is required').not().isEmpty(),
    check('location.state', 'State is required').not().isEmpty(),
    check('location.zipCode', 'Zip code is required').not().isEmpty()
  ],
  providerController.createProviderProfile
);

// @route   PUT api/providers/profile
// @desc    Update provider profile
// @access  Private
router.put('/profile', auth, providerController.updateProviderProfile);

// @route   GET api/providers/profile
// @desc    Get current provider profile
// @access  Private
router.get('/profile', auth, providerController.getCurrentProviderProfile);

// @route   GET api/providers/user/:userId
// @desc    Get provider profile by user ID
// @access  Public
router.get('/user/:userId', providerController.getProviderProfileByUserId);

// @route   POST api/providers/portfolio
// @desc    Add portfolio item
// @access  Private
router.post(
  '/portfolio',
  [
    auth,
    check('title', 'Title is required').not().isEmpty(),
    check('imageUrl', 'Image URL is required').not().isEmpty()
  ],
  providerController.addPortfolioItem
);

// @route   DELETE api/providers/portfolio/:itemId
// @desc    Remove portfolio item
// @access  Private
router.delete('/portfolio/:itemId', auth, providerController.removePortfolioItem);

// @route   PUT api/providers/availability
// @desc    Update availability
// @access  Private
router.put('/availability', auth, providerController.updateAvailability);

// @route   GET api/providers/:id/availability
// @desc    Get provider availability
// @access  Public
router.get('/:id/availability', providerController.getProviderAvailability);

// @route   POST api/providers/verification
// @desc    Upload verification documents
// @access  Private
router.post('/verification', auth, providerController.uploadVerificationDocuments);

module.exports = router;
