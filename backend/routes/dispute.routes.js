const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const disputeController = require('../controllers/dispute.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   POST api/disputes
// @desc    Create a new dispute
// @access  Private
router.post(
  '/',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty(),
    check('category', 'Category is required').isIn([
      'service_not_provided',
      'service_incomplete',
      'service_quality',
      'late_arrival',
      'no_show',
      'payment_issue',
      'unprofessional_behavior',
      'safety_concern',
      'cancellation_dispute',
      'other'
    ]),
    check('subject', 'Subject is required').not().isEmpty().isLength({ max: 200 }),
    check('description', 'Description is required').not().isEmpty().isLength({ max: 2000 })
  ],
  disputeController.createDispute
);

// @route   GET api/disputes/my-disputes
// @desc    Get user's disputes
// @access  Private
router.get('/my-disputes', auth, disputeController.getUserDisputes);

// @route   GET api/disputes/admin/all
// @desc    Get all disputes (Admin)
// @access  Private/Admin
router.get('/admin/all', [auth, adminAuth], disputeController.getAllDisputes);

// @route   GET api/disputes/admin/statistics
// @desc    Get dispute statistics
// @access  Private/Admin
router.get('/admin/statistics', [auth, adminAuth], disputeController.getDisputeStatistics);

// @route   GET api/disputes/:id
// @desc    Get dispute by ID
// @access  Private
router.get('/:id', auth, disputeController.getDisputeById);

// @route   POST api/disputes/:id/respond
// @desc    Add response to dispute
// @access  Private
router.post(
  '/:id/respond',
  [
    auth,
    check('message', 'Message is required').not().isEmpty().isLength({ max: 2000 })
  ],
  disputeController.addResponse
);

// @route   POST api/disputes/:id/assign
// @desc    Assign dispute to admin
// @access  Private/Admin
router.post('/:id/assign', [auth, adminAuth], disputeController.assignDispute);

// @route   POST api/disputes/:id/escalate
// @desc    Escalate dispute
// @access  Private/Admin
router.post(
  '/:id/escalate',
  [
    auth,
    adminAuth,
    check('reason', 'Reason is required').not().isEmpty()
  ],
  disputeController.escalateDispute
);

// @route   POST api/disputes/:id/resolve
// @desc    Resolve dispute
// @access  Private/Admin
router.post(
  '/:id/resolve',
  [
    auth,
    adminAuth,
    check('resolutionType', 'Resolution type is required').isIn([
      'refund_issued',
      'partial_refund',
      'service_rescheduled',
      'warning_issued',
      'no_action',
      'account_suspended',
      'mediation_completed',
      'other'
    ]),
    check('description', 'Description is required').not().isEmpty()
  ],
  disputeController.resolveDispute
);

// @route   POST api/disputes/:id/close
// @desc    Close dispute
// @access  Private/Admin
router.post(
  '/:id/close',
  [
    auth,
    adminAuth,
    check('reason', 'Reason is required').not().isEmpty()
  ],
  disputeController.closeDispute
);

// @route   POST api/disputes/:id/rate
// @desc    Submit satisfaction rating for resolved dispute
// @access  Private
router.post(
  '/:id/rate',
  [
    auth,
    check('rating', 'Rating is required').isInt({ min: 1, max: 5 })
  ],
  disputeController.submitSatisfactionRating
);

module.exports = router;
