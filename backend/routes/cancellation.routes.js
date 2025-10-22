const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const cancellationController = require('../controllers/cancellation.controller');
const auth = require('../middleware/auth');

// @route   POST api/cancellation-policies
// @desc    Create cancellation policy
// @access  Private/Provider
router.post(
  '/',
  [
    auth,
    check('name', 'Policy name is required').not().isEmpty()
  ],
  cancellationController.createPolicy
);

// @route   GET api/cancellation-policies/my-policies
// @desc    Get provider's cancellation policies
// @access  Private/Provider
router.get('/my-policies', auth, cancellationController.getProviderPolicies);

// @route   GET api/cancellation-policies/template
// @desc    Get default policy template
// @access  Private/Provider
router.get('/template', auth, cancellationController.getDefaultTemplate);

// @route   GET api/cancellation-policies/statistics
// @desc    Get cancellation statistics for provider
// @access  Private/Provider
router.get('/statistics', auth, cancellationController.getCancellationStatistics);

// @route   GET api/cancellation-policies/:id
// @desc    Get cancellation policy by ID
// @access  Public
router.get('/:id', cancellationController.getPolicyById);

// @route   PUT api/cancellation-policies/:id
// @desc    Update cancellation policy
// @access  Private/Provider
router.put('/:id', auth, cancellationController.updatePolicy);

// @route   DELETE api/cancellation-policies/:id
// @desc    Delete cancellation policy
// @access  Private/Provider
router.delete('/:id', auth, cancellationController.deletePolicy);

// @route   POST api/cancellation-policies/calculate-penalty
// @desc    Calculate cancellation penalty for a booking
// @access  Private
router.post(
  '/calculate-penalty',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  cancellationController.calculateCancellationPenalty
);

// @route   POST api/cancellation-policies/check-reschedule
// @desc    Check if rescheduling is allowed for a booking
// @access  Private
router.post(
  '/check-reschedule',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  cancellationController.checkRescheduleEligibility
);

// @route   POST api/cancellation-policies/apply-cancellation
// @desc    Apply cancellation to booking
// @access  Private
router.post(
  '/apply-cancellation',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  cancellationController.applyCancellation
);

// @route   POST api/cancellation-policies/mark-no-show
// @desc    Mark booking as no-show
// @access  Private/Provider
router.post(
  '/mark-no-show',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  cancellationController.markAsNoShow
);

module.exports = router;
