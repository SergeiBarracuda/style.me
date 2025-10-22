const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reminderController = require('../controllers/reminder.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   GET api/reminders
// @desc    Get user's reminders
// @access  Private
router.get('/', auth, reminderController.getUserReminders);

// @route   GET api/reminders/booking/:bookingId
// @desc    Get reminders for a specific booking
// @access  Private
router.get('/booking/:bookingId', auth, reminderController.getBookingReminders);

// @route   GET api/reminders/statistics
// @desc    Get reminder statistics (Admin)
// @access  Private/Admin
router.get('/statistics', [auth, adminAuth], reminderController.getReminderStatistics);

// @route   POST api/reminders
// @desc    Create custom reminder
// @access  Private
router.post(
  '/',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty(),
    check('scheduledFor', 'Scheduled date is required').isISO8601(),
    check('notificationMethod', 'Notification method is required').isIn(['email', 'sms', 'push', 'in_app']),
    check('subject', 'Subject is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  reminderController.createCustomReminder
);

// @route   POST api/reminders/process
// @desc    Process pending reminders (System/Cron)
// @access  Private/Admin
router.post('/process', [auth, adminAuth], reminderController.processPendingReminders);

// @route   POST api/reminders/retry
// @desc    Retry failed reminders (System/Cron)
// @access  Private/Admin
router.post('/retry', [auth, adminAuth], reminderController.retryFailedReminders);

// @route   PUT api/reminders/preferences
// @desc    Update user reminder preferences
// @access  Private
router.put('/preferences', auth, reminderController.updateReminderPreferences);

// @route   PUT api/reminders/:id
// @desc    Update reminder
// @access  Private
router.put('/:id', auth, reminderController.updateReminder);

// @route   DELETE api/reminders/:id
// @desc    Delete reminder
// @access  Private
router.delete('/:id', auth, reminderController.deleteReminder);

module.exports = router;
