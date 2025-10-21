const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const twoFactorController = require('../controllers/twoFactor.controller');
const auth = require('../middleware/auth');

// @route   POST api/2fa/generate
// @desc    Generate 2FA secret and QR code
// @access  Private
router.post('/generate', auth, twoFactorController.generateTwoFactorSecret);

// @route   POST api/2fa/enable
// @desc    Verify token and enable 2FA
// @access  Private
router.post(
  '/enable',
  [
    auth,
    check('token', 'Token is required').not().isEmpty()
  ],
  twoFactorController.enableTwoFactor
);

// @route   POST api/2fa/verify
// @desc    Verify 2FA token during login
// @access  Public
router.post(
  '/verify',
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('token', 'Token is required').not().isEmpty()
  ],
  twoFactorController.verifyTwoFactorToken
);

// @route   POST api/2fa/login
// @desc    Complete login after successful 2FA verification
// @access  Public
router.post(
  '/login',
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('token', 'Token is required').not().isEmpty()
  ],
  twoFactorController.completeTwoFactorLogin
);

// @route   POST api/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.post(
  '/disable',
  [
    auth,
    check('password', 'Password is required').not().isEmpty()
  ],
  twoFactorController.disableTwoFactor
);

// @route   GET api/2fa/status
// @desc    Get 2FA status
// @access  Private
router.get('/status', auth, twoFactorController.getTwoFactorStatus);

// @route   POST api/2fa/backup-codes/regenerate
// @desc    Regenerate backup codes
// @access  Private
router.post(
  '/backup-codes/regenerate',
  [
    auth,
    check('password', 'Password is required').not().isEmpty()
  ],
  twoFactorController.regenerateBackupCodes
);

module.exports = router;
