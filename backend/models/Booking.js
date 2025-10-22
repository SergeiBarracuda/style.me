const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'disputed'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  // Cancellation fields
  cancellationReason: {
    type: String,
    trim: true
  },
  cancellationNotes: {
    type: String,
    trim: true
  },
  cancellationDate: {
    type: Date
  },
  cancellationBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledBy: {
    type: String,
    enum: ['client', 'provider', 'admin', null],
    default: null
  },
  cancellationPenalty: {
    type: Number,
    default: 0
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  // Rescheduling tracking
  rescheduleCount: {
    type: Number,
    default: 0
  },
  originalScheduledDate: {
    type: Date
  },
  isReviewed: {
    type: Boolean,
    default: false
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

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
