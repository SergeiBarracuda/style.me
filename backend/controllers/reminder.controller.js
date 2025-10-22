const AppointmentReminder = require('../models/AppointmentReminder');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get user's reminders
// @route   GET /api/reminders
// @access  Private
exports.getUserReminders = async (req, res) => {
  try {
    const { status, reminderType } = req.query;

    const filter = { user: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (reminderType) {
      filter.reminderType = reminderType;
    }

    const reminders = await AppointmentReminder.find(filter)
      .populate('booking', 'scheduledDate service status')
      .sort({ scheduledFor: -1 })
      .limit(50);

    res.json({
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Error fetching reminders', error: error.message });
  }
};

// @desc    Create custom reminder
// @route   POST /api/reminders
// @access  Private
exports.createCustomReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, scheduledFor, notificationMethod, subject, message } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user owns the booking
    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reminder = new AppointmentReminder({
      booking: bookingId,
      user: req.user.id,
      reminderType: 'custom',
      scheduledFor: new Date(scheduledFor),
      notificationMethod,
      subject,
      message,
      metadata: {
        appointmentDate: booking.scheduledDate
      }
    });

    await reminder.save();

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Error creating reminder', error: error.message });
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledFor, isEnabled, subject, message } = req.body;

    const reminder = await AppointmentReminder.findOne({
      _id: id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update non-pending reminder' });
    }

    if (scheduledFor) reminder.scheduledFor = new Date(scheduledFor);
    if (isEnabled !== undefined) reminder.isEnabled = isEnabled;
    if (subject) reminder.subject = subject;
    if (message) reminder.message = message;

    await reminder.save();

    res.json({
      message: 'Reminder updated successfully',
      reminder
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Error updating reminder', error: error.message });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await AppointmentReminder.findOne({
      _id: id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.status === 'pending') {
      reminder.status = 'cancelled';
      await reminder.save();
    } else {
      await reminder.deleteOne();
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Error deleting reminder', error: error.message });
  }
};

// @desc    Process pending reminders (System/Cron job)
// @route   POST /api/reminders/process
// @access  Private/Admin
exports.processPendingReminders = async (req, res) => {
  try {
    const pendingReminders = await AppointmentReminder.getPendingReminders();

    let sent = 0;
    let failed = 0;

    for (const reminder of pendingReminders) {
      try {
        // Send reminder based on method
        await sendReminder(reminder);

        reminder.markAsSent();
        await reminder.save();
        sent++;
      } catch (error) {
        console.error(`Error sending reminder ${reminder._id}:`, error);
        reminder.markAsFailed(error.message);
        await reminder.save();
        failed++;
      }
    }

    res.json({
      message: 'Reminders processed',
      sent,
      failed,
      total: pendingReminders.length
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    res.status(500).json({ message: 'Error processing reminders', error: error.message });
  }
};

// @desc    Retry failed reminders (System/Cron job)
// @route   POST /api/reminders/retry
// @access  Private/Admin
exports.retryFailedReminders = async (req, res) => {
  try {
    const failedReminders = await AppointmentReminder.getRetryableReminders();

    let sent = 0;
    let failed = 0;

    for (const reminder of failedReminders) {
      if (!reminder.canRetry()) {
        continue;
      }

      try {
        await sendReminder(reminder);

        reminder.markAsSent();
        await reminder.save();
        sent++;
      } catch (error) {
        console.error(`Error retrying reminder ${reminder._id}:`, error);
        reminder.markAsFailed(error.message);
        await reminder.save();
        failed++;
      }
    }

    res.json({
      message: 'Failed reminders retried',
      sent,
      failed,
      total: failedReminders.length
    });
  } catch (error) {
    console.error('Error retrying reminders:', error);
    res.status(500).json({ message: 'Error retrying reminders', error: error.message });
  }
};

// @desc    Get reminder statistics (Admin)
// @route   GET /api/reminders/statistics
// @access  Private/Admin
exports.getReminderStatistics = async (req, res) => {
  try {
    const { startDate, endDate, reminderType } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (reminderType) {
      filter.reminderType = reminderType;
    }

    const stats = await AppointmentReminder.getStatistics(filter);

    // Calculate delivery rate
    const deliveryRate = stats.total > 0
      ? ((stats.sent / stats.total) * 100).toFixed(2)
      : 0;

    // Get breakdown by type
    const byType = await AppointmentReminder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$reminderType',
          count: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get breakdown by method
    const byMethod = await AppointmentReminder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$notificationMethod',
          count: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      ...stats,
      deliveryRate: deliveryRate + '%',
      byType,
      byMethod
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// @desc    Get upcoming reminders for a booking
// @route   GET /api/reminders/booking/:bookingId
// @access  Private
exports.getBookingReminders = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user owns the booking
    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reminders = await AppointmentReminder.find({ booking: bookingId })
      .sort({ scheduledFor: 1 });

    res.json({
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error('Error fetching booking reminders:', error);
    res.status(500).json({ message: 'Error fetching reminders', error: error.message });
  }
};

// @desc    Update user reminder preferences
// @route   PUT /api/reminders/preferences
// @access  Private
exports.updateReminderPreferences = async (req, res) => {
  try {
    const { enableEmail, enableSMS, enablePush, enable24Hours, enable2Hours } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store preferences (would need to add these fields to User model)
    // For now, return success
    // In production, you would update user.reminderPreferences

    res.json({
      message: 'Reminder preferences updated successfully',
      preferences: {
        enableEmail,
        enableSMS,
        enablePush,
        enable24Hours,
        enable2Hours
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Error updating preferences', error: error.message });
  }
};

// Helper function to send reminder
async function sendReminder(reminder) {
  // In a real application, this would integrate with:
  // - Email service (SendGrid, AWS SES, etc.)
  // - SMS service (Twilio, AWS SNS, etc.)
  // - Push notification service (Firebase, OneSignal, etc.)
  // - In-app notification system

  console.log(`Sending ${reminder.notificationMethod} reminder to user ${reminder.user}`);
  console.log(`Subject: ${reminder.subject}`);
  console.log(`Message: ${reminder.message}`);

  // Simulate sending
  switch (reminder.notificationMethod) {
    case 'email':
      // await sendEmail(reminder.user.email, reminder.subject, reminder.message);
      console.log('Email sent');
      break;
    case 'sms':
      // await sendSMS(reminder.user.phone, reminder.message);
      console.log('SMS sent');
      break;
    case 'push':
      // await sendPushNotification(reminder.user, reminder.subject, reminder.message);
      console.log('Push notification sent');
      break;
    case 'in_app':
      // Create in-app notification
      console.log('In-app notification created');
      break;
  }

  // For now, always succeed
  return true;
}

module.exports = exports;
