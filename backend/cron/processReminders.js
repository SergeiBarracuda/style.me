const cron = require('node-cron');
const AppointmentReminder = require('../models/AppointmentReminder');
const Booking = require('../models/Booking');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure email transporter (replace with your actual email service)
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email notification
 */
async function sendEmailReminder(reminder, user, booking) {
  try {
    const subject = getReminderSubject(reminder.reminderType);
    const html = getReminderEmailTemplate(reminder, user, booking);

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@style.me',
      to: user.email,
      subject,
      html
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Send SMS notification (placeholder - integrate with Twilio/similar)
 */
async function sendSMSReminder(reminder, user, booking) {
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`SMS reminder would be sent to ${user.phone}: ${reminder.message}`);
  return true; // Placeholder return
}

/**
 * Send push notification (placeholder - integrate with FCM/similar)
 */
async function sendPushReminder(reminder, user, booking) {
  // TODO: Integrate with Push notification service (FCM, OneSignal, etc.)
  console.log(`Push reminder would be sent to user ${user._id}: ${reminder.message}`);
  return true; // Placeholder return
}

/**
 * Create in-app notification
 */
async function sendInAppReminder(reminder, user, booking) {
  // This would typically create a notification record in the database
  // that the frontend can fetch and display
  console.log(`In-app reminder created for user ${user._id}`);
  return true;
}

/**
 * Get reminder subject based on type
 */
function getReminderSubject(type) {
  const subjects = {
    initial_confirmation: 'Booking Confirmation',
    '24_hours_before': 'Appointment Reminder - Tomorrow',
    '2_hours_before': 'Appointment Starting Soon',
    'on_appointment_day': 'Your Appointment is Today',
    custom: 'Appointment Reminder'
  };
  return subjects[type] || 'Appointment Reminder';
}

/**
 * Get email template
 */
function getReminderEmailTemplate(reminder, user, booking) {
  const appointmentDate = new Date(booking.scheduledDate).toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .appointment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${getReminderSubject(reminder.reminderType)}</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>${reminder.message}</p>

          <div class="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Service:</strong> ${booking.service || 'Service'}</p>
            <p><strong>Date & Time:</strong> ${appointmentDate}</p>
            <p><strong>Provider:</strong> ${booking.provider?.businessName || 'Provider'}</p>
            ${booking.location ? `<p><strong>Location:</strong> ${booking.location}</p>` : ''}
          </div>

          <p>If you need to reschedule or cancel, please do so at least ${booking.provider?.cancellationPolicy?.minNoticeHours || 24} hours in advance.</p>

          <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}" class="button">View Booking Details</a>
        </div>
        <div class="footer">
          <p>This is an automated reminder. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Style.me - Beauty Service Marketplace</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Process a single reminder
 */
async function processReminder(reminder) {
  try {
    const booking = await Booking.findById(reminder.booking)
      .populate('provider', 'businessName cancellationPolicy')
      .populate('service', 'name');

    if (!booking) {
      console.log(`Booking not found for reminder ${reminder._id}`);
      reminder.status = 'failed';
      reminder.error = 'Booking not found';
      await reminder.save();
      return;
    }

    // Check if booking is still valid
    if (['cancelled', 'completed'].includes(booking.status)) {
      console.log(`Booking ${booking._id} is ${booking.status}, skipping reminder`);
      reminder.status = 'cancelled';
      await reminder.save();
      return;
    }

    const user = await User.findById(reminder.user);
    if (!user) {
      console.log(`User not found for reminder ${reminder._id}`);
      reminder.status = 'failed';
      reminder.error = 'User not found';
      await reminder.save();
      return;
    }

    let success = false;

    // Send notification based on method
    switch (reminder.notificationMethod) {
      case 'email':
        success = await sendEmailReminder(reminder, user, booking);
        break;
      case 'sms':
        success = await sendSMSReminder(reminder, user, booking);
        break;
      case 'push':
        success = await sendPushReminder(reminder, user, booking);
        break;
      case 'in_app':
        success = await sendInAppReminder(reminder, user, booking);
        break;
      default:
        console.log(`Unknown notification method: ${reminder.notificationMethod}`);
        success = false;
    }

    if (success) {
      reminder.markAsSent();
      console.log(`Reminder ${reminder._id} sent successfully via ${reminder.notificationMethod}`);
    } else {
      // Retry logic
      if (reminder.retryCount < reminder.maxRetries) {
        reminder.retryCount += 1;
        reminder.scheduledFor = new Date(Date.now() + 15 * 60 * 1000); // Retry in 15 minutes
        await reminder.save();
        console.log(`Reminder ${reminder._id} failed, scheduled for retry ${reminder.retryCount}/${reminder.maxRetries}`);
      } else {
        reminder.status = 'failed';
        reminder.error = 'Max retries exceeded';
        await reminder.save();
        console.log(`Reminder ${reminder._id} failed after ${reminder.maxRetries} retries`);
      }
    }
  } catch (error) {
    console.error(`Error processing reminder ${reminder._id}:`, error);

    // Update reminder with error
    reminder.status = 'failed';
    reminder.error = error.message;
    await reminder.save();
  }
}

/**
 * Main cron job function
 */
async function processPendingReminders() {
  console.log('[CRON] Processing pending reminders...', new Date().toISOString());

  try {
    const pendingReminders = await AppointmentReminder.getPendingReminders();

    console.log(`[CRON] Found ${pendingReminders.length} pending reminders`);

    for (const reminder of pendingReminders) {
      await processReminder(reminder);
    }

    console.log('[CRON] Reminder processing complete');
  } catch (error) {
    console.error('[CRON] Error in reminder processing:', error);
  }
}

/**
 * Initialize cron job
 * Runs every 5 minutes
 */
function initializeReminderCron() {
  // Run every 5 minutes: '*/5 * * * *'
  // For production, you might want to run more frequently: '*/1 * * * *' (every minute)
  const schedule = process.env.REMINDER_CRON_SCHEDULE || '*/5 * * * *';

  cron.schedule(schedule, processPendingReminders, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  console.log(`[CRON] Reminder processing cron job initialized (schedule: ${schedule})`);

  // Run immediately on startup
  if (process.env.REMINDER_RUN_ON_STARTUP === 'true') {
    processPendingReminders();
  }
}

module.exports = {
  initializeReminderCron,
  processPendingReminders
};
