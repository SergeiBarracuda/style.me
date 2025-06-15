const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const bookingController = require('../controllers/booking.controller');
const auth = require('../middleware/auth');

// @route   POST api/bookings
// @desc    Create booking
// @access  Private
router.post(
  '/',
  [
    auth,
    check('serviceId', 'Service ID is required').not().isEmpty(),
    check('dateTime', 'Date and time are required').not().isEmpty()
  ],
  bookingController.createBooking
);

// @route   GET api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, bookingController.getBookingById);

// @route   GET api/bookings/client
// @desc    Get client bookings
// @access  Private
router.get('/client', auth, bookingController.getClientBookings);

// @route   GET api/bookings/provider
// @desc    Get provider bookings
// @access  Private
router.get('/provider', auth, bookingController.getProviderBookings);

// @route   PUT api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put(
  '/:id/status',
  [
    auth,
    check('status', 'Status is required').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'])
  ],
  bookingController.updateBookingStatus
);

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put(
  '/:id/cancel',
  [
    auth,
    check('cancellationReason', 'Cancellation reason is required').not().isEmpty()
  ],
  bookingController.cancelBooking
);

// @route   PUT api/bookings/:id/reschedule
// @desc    Reschedule booking
// @access  Private
router.put(
  '/:id/reschedule',
  [
    auth,
    check('dateTime', 'Date and time are required').not().isEmpty()
  ],
  bookingController.rescheduleBooking
);

module.exports = router;
