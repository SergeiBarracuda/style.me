const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getUserProfile);

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    check('firstName', 'First name is required').optional(),
    check('lastName', 'Last name is required').optional(),
    check('phone', 'Phone number is invalid').optional().isMobilePhone()
  ],
  userController.updateUserProfile
);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, userController.getUserById);

// @route   POST api/users/favorites
// @desc    Add provider to favorites
// @access  Private
router.post(
  '/favorites',
  [
    auth,
    check('providerId', 'Provider ID is required').not().isEmpty()
  ],
  userController.addToFavorites
);

// @route   DELETE api/users/favorites/:providerId
// @desc    Remove provider from favorites
// @access  Private
router.delete('/favorites/:providerId', auth, userController.removeFromFavorites);

// @route   GET api/users/favorites
// @desc    Get user favorites
// @access  Private
router.get('/favorites', auth, userController.getUserFavorites);

// @route   PUT api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, userController.updateUserPreferences);

// @route   POST api/users/verification
// @desc    Upload verification document
// @access  Private
router.post('/verification', auth, userController.uploadVerification);

module.exports = router;
