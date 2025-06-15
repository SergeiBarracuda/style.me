const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');

// @route   POST api/payments/create-intent
// @desc    Create payment intent
// @access  Private
router.post(
  '/create-intent',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  paymentController.createPaymentIntent
);

// @route   POST api/payments/confirm
// @desc    Confirm payment
// @access  Private
router.post(
  '/confirm',
  [
    auth,
    check('paymentIntentId', 'Payment intent ID is required').not().isEmpty(),
    check('bookingId', 'Booking ID is required').not().isEmpty()
  ],
  paymentController.confirmPayment
);

// @route   POST api/payments/refund
// @desc    Process refund
// @access  Private
router.post(
  '/refund',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty(),
    check('reason', 'Reason is required').not().isEmpty()
  ],
  paymentController.processRefund
);

// @route   GET api/payments/booking/:bookingId
// @desc    Get payment by booking ID
// @access  Private
router.get('/booking/:bookingId', auth, paymentController.getPaymentByBookingId);

// @route   GET api/payments/client
// @desc    Get client payments
// @access  Private
router.get('/client', auth, paymentController.getClientPayments);

// @route   GET api/payments/provider
// @desc    Get provider payments
// @access  Private
router.get('/provider', auth, paymentController.getProviderPayments);

// @route   POST api/payments/webhook
// @desc    Webhook handler for Stripe events
// @access  Public
router.post('/webhook', paymentController.handleStripeWebhook);

module.exports = router;
