const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const { validationResult } = require('express-validator');

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to pay for this booking
    if (booking.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.price * 100, // Stripe uses cents
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        clientId: booking.client.toString(),
        providerId: booking.provider.toString()
      }
    });

    // Find and update payment record
    const payment = await Payment.findOne({ booking: booking._id });
    if (payment) {
      payment.stripePaymentIntentId = paymentIntent.id;
      await payment.save();
    }

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.error('Error in createPaymentIntent controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Find payment
    const payment = await Payment.findOne({ booking: booking._id });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    payment.status = 'completed';
    payment.stripePaymentIntentId = paymentIntentId;
    await payment.save();

    // Update booking payment status
    booking.paymentStatus = 'paid';
    await booking.save();

    res.json({ message: 'Payment confirmed', payment });
  } catch (err) {
    console.error('Error in confirmPayment controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is paid
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Booking is not paid' });
    }

    // Find payment
    const payment = await Payment.findOne({ booking: booking._id });
    if (!payment || !payment.stripePaymentIntentId) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer'
    });

    // Update payment status
    payment.status = 'refunded';
    payment.refundReason = reason;
    payment.refundedAt = Date.now();
    await payment.save();

    // Update booking payment status
    booking.paymentStatus = 'refunded';
    await booking.save();

    res.json({ message: 'Refund processed', payment });
  } catch (err) {
    console.error('Error in processRefund controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get payment by booking ID
exports.getPaymentByBookingId = async (req, res) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to view this payment
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isClient = booking.client.toString() === req.user.id;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    const isProvider = providerProfile && booking.provider.toString() === providerProfile._id.toString();

    if (!isClient && !isProvider) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(payment);
  } catch (err) {
    console.error('Error in getPaymentByBookingId controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get client payments
exports.getClientPayments = async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user.id });
    const bookingIds = bookings.map(booking => booking._id);

    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error in getClientPayments controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider payments
exports.getProviderPayments = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const payments = await Payment.find({ provider: providerProfile._id })
      .populate('booking')
      .populate('client', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error in getProviderPayments controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Webhook handler for Stripe events
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await handlePaymentIntentFailed(failedPaymentIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Helper function to handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const { bookingId } = paymentIntent.metadata;

    // Find and update payment
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (payment) {
      payment.status = 'completed';
      await payment.save();
    }

    // Update booking
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      await booking.save();
    }
  } catch (err) {
    console.error('Error handling payment_intent.succeeded:', err.message);
  }
}

// Helper function to handle failed payment
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const { bookingId } = paymentIntent.metadata;

    // Find and update payment
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (payment) {
      payment.status = 'failed';
      await payment.save();
    }

    // Update booking
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
    }
  } catch (err) {
    console.error('Error handling payment_intent.payment_failed:', err.message);
  }
}
