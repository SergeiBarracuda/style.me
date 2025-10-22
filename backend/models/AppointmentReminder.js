const mongoose = require('mongoose');

const appointmentReminderSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reminderType: {
    type: String,
    enum: [
      'initial_confirmation',
      '24_hours_before',
      '2_hours_before',
      '30_minutes_before',
      'day_after_followup',
      'custom'
    ],
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  notificationMethod: {
    type: String,
    enum: ['email', 'sms', 'push', 'in_app'],
    required: true
  },
  // Message content
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Delivery tracking
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  // User preferences
  isEnabled: {
    type: Boolean,
    default: true
  },
  // Metadata
  metadata: {
    providerName: String,
    serviceName: String,
    appointmentDate: Date,
    appointmentTime: String,
    location: String,
    price: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
appointmentReminderSchema.index({ booking: 1 });
appointmentReminderSchema.index({ user: 1, status: 1 });
appointmentReminderSchema.index({ scheduledFor: 1, status: 1 });
appointmentReminderSchema.index({ status: 1, scheduledFor: 1 });

// Method to mark reminder as sent
appointmentReminderSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
};

// Method to mark reminder as failed
appointmentReminderSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorMessage = errorMessage;
  this.retryCount += 1;
};

// Method to check if can retry
appointmentReminderSchema.methods.canRetry = function() {
  return this.retryCount < this.maxRetries && this.status === 'failed';
};

// Static method to get pending reminders
appointmentReminderSchema.statics.getPendingReminders = async function(cutoffTime = new Date()) {
  return await this.find({
    status: 'pending',
    scheduledFor: { $lte: cutoffTime },
    isEnabled: true
  })
    .populate('booking')
    .populate('user', 'firstName lastName email phone')
    .sort({ scheduledFor: 1 });
};

// Static method to get failed reminders that can retry
appointmentReminderSchema.statics.getRetryableReminders = async function() {
  return await this.find({
    status: 'failed',
    retryCount: { $lt: this.maxRetries }
  })
    .populate('booking')
    .populate('user', 'firstName lastName email phone')
    .sort({ scheduledFor: 1 });
};

// Static method to create reminder templates
appointmentReminderSchema.statics.createBookingReminders = async function(booking, user) {
  const appointmentDate = new Date(booking.scheduledDate);
  const reminders = [];

  // Initial confirmation reminder (sent immediately)
  reminders.push({
    booking: booking._id,
    user: user._id,
    reminderType: 'initial_confirmation',
    scheduledFor: new Date(),
    notificationMethod: 'email',
    subject: 'Booking Confirmation',
    message: `Your appointment has been confirmed for ${appointmentDate.toLocaleString()}.`,
    metadata: {
      providerName: booking.provider.businessName,
      serviceName: booking.service.name,
      appointmentDate,
      price: booking.price
    }
  });

  // 24 hours before reminder
  const twentyFourHoursBefore = new Date(appointmentDate);
  twentyFourHoursBefore.setHours(twentyFourHoursBefore.getHours() - 24);
  if (twentyFourHoursBefore > new Date()) {
    reminders.push({
      booking: booking._id,
      user: user._id,
      reminderType: '24_hours_before',
      scheduledFor: twentyFourHoursBefore,
      notificationMethod: 'email',
      subject: 'Appointment Reminder - Tomorrow',
      message: `Reminder: Your appointment is tomorrow at ${appointmentDate.toLocaleString()}.`,
      metadata: {
        providerName: booking.provider.businessName,
        serviceName: booking.service.name,
        appointmentDate,
        price: booking.price
      }
    });
  }

  // 2 hours before reminder
  const twoHoursBefore = new Date(appointmentDate);
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  if (twoHoursBefore > new Date()) {
    reminders.push({
      booking: booking._id,
      user: user._id,
      reminderType: '2_hours_before',
      scheduledFor: twoHoursBefore,
      notificationMethod: 'push',
      subject: 'Appointment Soon',
      message: `Your appointment is in 2 hours at ${appointmentDate.toLocaleString()}.`,
      metadata: {
        providerName: booking.provider.businessName,
        serviceName: booking.service.name,
        appointmentDate,
        price: booking.price
      }
    });
  }

  // Day after follow-up
  const dayAfter = new Date(appointmentDate);
  dayAfter.setDate(dayAfter.getDate() + 1);
  reminders.push({
    booking: booking._id,
    user: user._id,
    reminderType: 'day_after_followup',
    scheduledFor: dayAfter,
    notificationMethod: 'in_app',
    subject: 'How was your appointment?',
    message: `We hope you enjoyed your service! Please take a moment to rate your experience.`,
    metadata: {
      providerName: booking.provider.businessName,
      serviceName: booking.service.name,
      appointmentDate,
      price: booking.price
    }
  });

  return await this.insertMany(reminders);
};

// Static method to cancel reminders for a booking
appointmentReminderSchema.statics.cancelBookingReminders = async function(bookingId) {
  return await this.updateMany(
    {
      booking: bookingId,
      status: 'pending'
    },
    {
      $set: {
        status: 'cancelled'
      }
    }
  );
};

// Static method to get reminder statistics
appointmentReminderSchema.statics.getStatistics = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        sent: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0
  };
};

const AppointmentReminder = mongoose.model('AppointmentReminder', appointmentReminderSchema);

module.exports = AppointmentReminder;
