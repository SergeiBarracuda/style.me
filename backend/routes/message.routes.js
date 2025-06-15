const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const messageController = require('../controllers/message.controller');
const auth = require('../middleware/auth');

// @route   POST api/messages
// @desc    Send message
// @access  Private
router.post(
  '/',
  [
    auth,
    check('receiverId', 'Receiver ID is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty()
  ],
  messageController.sendMessage
);

// @route   GET api/messages/conversation/:userId
// @desc    Get conversation with user
// @access  Private
router.get('/conversation/:userId', auth, messageController.getConversation);

// @route   GET api/messages/conversations
// @desc    Get conversations list
// @access  Private
router.get('/conversations', auth, messageController.getConversationsList);

// @route   PUT api/messages/read
// @desc    Mark messages as read
// @access  Private
router.put(
  '/read',
  [
    auth,
    check('messageIds', 'Message IDs are required').isArray()
  ],
  messageController.markAsRead
);

module.exports = router;
