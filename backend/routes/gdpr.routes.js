const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const gdprController = require('../controllers/gdpr.controller');
const auth = require('../middleware/auth');

// @route   POST api/gdpr/consent
// @desc    Record user consent
// @access  Private
router.post(
  '/consent',
  [
    auth,
    check('consentType', 'Consent type is required').isIn([
      'terms_of_service',
      'privacy_policy',
      'marketing_emails',
      'analytics_tracking',
      'location_tracking',
      'data_processing',
      'third_party_sharing'
    ]),
    check('granted', 'Granted status is required').isBoolean(),
    check('version', 'Version is required').not().isEmpty()
  ],
  gdprController.recordConsent
);

// @route   GET api/gdpr/consents
// @desc    Get user consents
// @access  Private
router.get('/consents', auth, gdprController.getUserConsents);

// @route   GET api/gdpr/export
// @desc    Export user data (GDPR Right to Data Portability)
// @access  Private
router.get('/export', auth, gdprController.exportUserData);

// @route   GET api/gdpr/download
// @desc    Request data download (generates downloadable file)
// @access  Private
router.get('/download', auth, gdprController.requestDataDownload);

// @route   GET api/gdpr/privacy-settings
// @desc    Get privacy settings
// @access  Private
router.get('/privacy-settings', auth, gdprController.getPrivacySettings);

// @route   PUT api/gdpr/privacy-settings
// @desc    Update privacy settings
// @access  Private
router.put('/privacy-settings', auth, gdprController.updatePrivacySettings);

// @route   DELETE api/gdpr/account
// @desc    Delete user account (GDPR Right to be Forgotten)
// @access  Private
router.delete(
  '/account',
  [
    auth,
    check('password', 'Password is required').not().isEmpty(),
    check('confirmDeletion', 'Confirmation text is required').equals('DELETE MY ACCOUNT')
  ],
  gdprController.deleteUserAccount
);

module.exports = router;
