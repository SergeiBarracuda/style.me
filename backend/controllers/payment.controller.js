const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const Promotion = require('../models/Promotion');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const { validationResult } = require('express-validator');

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, promotionCode, useRewardId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId).populate('provider');
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

    let finalAmount = booking.price;
    let promotionDiscount = 0;
    let appliedPromotion = null;
    let rewardDiscount = 0;
    let appliedReward = null;

    // Apply promotion if provided
    if (promotionCode) {
      const promotion = await Promotion.findOne({
        code: promotionCode.toUpperCase(),
        isActive: true
      });

      if (promotion) {
        const isValid = promotion.isValid(req.user.id, finalAmount);
        if (isValid.valid) {
          promotionDiscount = promotion.calculateDiscount(finalAmount);
          finalAmount -= promotionDiscount;
          appliedPromotion = promotion;
        }
      }
    }

    // Apply loyalty reward if provided
    if (useRewardId) {
      const loyaltyProgram = await LoyaltyProgram.findOne({ user: req.user.id });
      if (loyaltyProgram) {
        const reward = loyaltyProgram.availableRewards.id(useRewardId);
        if (reward && !reward.isUsed && reward.expiryDate > new Date()) {
          if (reward.rewardType === 'discount') {
            rewardDiscount = (finalAmount * reward.value) / 100;
          } else if (reward.rewardType === 'cashback') {
            rewardDiscount = reward.value;
          }
          finalAmount -= rewardDiscount;
          appliedReward = reward;
        }
      }
    }

    // Calculate commission and provider earnings
    const providerProfile = await ProviderProfile.findById(booking.provider);
    let commissionRate = 15; // Default commission rate

    // Get provider's loyalty tier for potential commission discount
    const providerLoyalty = await LoyaltyProgram.findOne({ user: providerProfile.user });
    if (providerLoyalty) {
      const tierBenefits = LoyaltyProgram.getTierBenefits(providerLoyalty.tier);
      commissionRate -= tierBenefits.commissionDiscount;
    }

    // Apply promotion commission reduction for providers
    if (appliedPromotion && appliedPromotion.type === 'reduced_commission') {
      commissionRate = Math.max(0, commissionRate - appliedPromotion.value);
    }

    const platformFee = (finalAmount * commissionRate) / 100;
    const providerEarnings = finalAmount - platformFee;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        clientId: booking.client.toString(),
        providerId: booking.provider.toString(),
        originalAmount: booking.price.toString(),
        promotionDiscount: promotionDiscount.toString(),
        rewardDiscount: rewardDiscount.toString()
      }
    });

    // Find and update payment record
    let payment = await Payment.findOne({ booking: booking._id });
    if (!payment) {
      payment = new Payment({
        booking: booking._id,
        client: booking.client,
        provider: booking.provider,
        amount: booking.price
      });
    }

    payment.stripePaymentIntentId = paymentIntent.id;
    payment.amount = finalAmount;
    payment.commissionRate = commissionRate;
    payment.platformFee = platformFee;
    payment.providerEarnings = providerEarnings;
    payment.promotionDiscount = promotionDiscount;
    payment.promotionCode = promotionCode || null;
    payment.payoutStatus = 'pending';

    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      originalAmount: booking.price,
      promotionDiscount,
      rewardDiscount,
      finalAmount,
      breakdown: {
        subtotal: booking.price,
        promotionDiscount: -promotionDiscount,
        rewardDiscount: -rewardDiscount,
        total: finalAmount
      }
    });
  } catch (err) {
    console.error('Error in createPaymentIntent controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId, rewardId } = req.body;

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

    // Mark reward as used if provided
    if (rewardId) {
      const loyaltyProgram = await LoyaltyProgram.findOne({ user: req.user.id });
      if (loyaltyProgram) {
        const reward = loyaltyProgram.availableRewards.id(rewardId);
        if (reward && !reward.isUsed) {
          reward.isUsed = true;
          reward.usedAt = new Date();
          reward.usedInBooking = bookingId;
          await loyaltyProgram.save();
        }
      }
    }

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
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id })
      .populate('client')
      .populate('booking');
    if (payment) {
      payment.status = 'completed';
      await payment.save();

      // Record promotion usage if promotion was applied
      if (payment.promotionCode) {
        const promotion = await Promotion.findOne({ code: payment.promotionCode.toUpperCase() });
        if (promotion) {
          promotion.usedCount += 1;
          promotion.usageHistory.push({
            user: payment.client,
            booking: payment.booking._id,
            amount: payment.amount,
            discount: payment.promotionDiscount,
            usedAt: new Date()
          });
          await promotion.save();
        }
      }

      // Award loyalty points to client
      let clientLoyalty = await LoyaltyProgram.findOne({ user: payment.client });
      if (!clientLoyalty) {
        clientLoyalty = new LoyaltyProgram({ user: payment.client });
      }

      // Update spending and bookings
      clientLoyalty.totalSpent += payment.amount;
      clientLoyalty.totalBookings += 1;

      // Calculate points with tier multiplier
      const pointsToAdd = LoyaltyProgram.calculatePointsFromBooking(payment.amount);
      const tierBenefits = LoyaltyProgram.getTierBenefits(clientLoyalty.tier);
      const multipliedPoints = Math.floor(pointsToAdd * tierBenefits.pointsMultiplier);

      clientLoyalty.addPoints(
        multipliedPoints,
        `Booking completed - ${tierBenefits.pointsMultiplier}x multiplier`,
        payment.booking._id
      );

      await clientLoyalty.save();
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
