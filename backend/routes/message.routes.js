const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const messageController = require('../controllers/message.controller');
const auth = require('../middleware/auth');

// @route   POST api/messages
// @desc    Send text message
// @access  Private
router.post(
  '/',
  [
    auth,
    check('receiverId', 'Receiver ID is required').not().isEmpty()
  ],
  messageController.sendMessage
);

// @route   POST api/messages/with-media
// @desc    Send message with media attachments
// @access  Private
router.post('/with-media', auth, messageController.sendMessageWithMedia);

// @route   GET api/messages/conversations
// @desc    Get conversations list
// @access  Private
router.get('/conversations', auth, messageController.getConversationsList);

// @route   GET api/messages/unread/count
// @desc    Get unread messages count
// @access  Private
router.get('/unread/count', auth, messageController.getUnreadCount);

// @route   GET api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', auth, messageController.searchMessages);

// @route   GET api/messages/conversation/:userId
// @desc    Get conversation with user
// @access  Private
router.get('/conversation/:userId', auth, messageController.getConversation);

// @route   PUT api/messages/:id/read
// @desc    Mark single message as read
// @access  Private
router.put('/:id/read', auth, messageController.markAsRead);

// @route   PUT api/messages/conversation/:userId/read
// @desc    Mark entire conversation as read
// @access  Private
router.put('/conversation/:userId/read', auth, messageController.markConversationAsRead);

// @route   POST api/messages/:id/reaction
// @desc    Add reaction to message
// @access  Private
router.post(
  '/:id/reaction',
  [
    auth,
    check('emoji', 'Emoji is required').not().isEmpty()
  ],
  messageController.addReaction
);

// @route   DELETE api/messages/:id/reaction
// @desc    Remove reaction from message
// @access  Private
router.delete('/:id/reaction', auth, messageController.removeReaction);

// @route   DELETE api/messages/:id
// @desc    Delete message (soft delete)
// @access  Private
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;
