const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Commission and payout details
  commission: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 15 // Default 15% commission
  },
  platformFee: {
    type: Number,
    default: 0
  },
  providerEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  promotionDiscount: {
    type: Number,
    default: 0
  },
  promotionCode: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentIntentId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  // Payout tracking
  payoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  payoutDate: {
    type: Date
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe_connect']
  },
  payoutTransactionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
