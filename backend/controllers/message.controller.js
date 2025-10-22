const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/messages');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimeType);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
}).array('media', 5); // Max 5 files

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, content, messageType, media, relatedBookingId, replyTo } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create new message
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      messageType: messageType || 'text',
      content,
      media: media || [],
      relatedBooking: relatedBookingId,
      replyTo,
      deliveryStatus: 'sent'
    });

    await message.save();

    // Populate sender and receiver details
    await message.populate([
      { path: 'sender', select: 'firstName lastName profileImage' },
      { path: 'receiver', select: 'firstName lastName profileImage' },
      { path: 'replyTo', select: 'content sender' }
    ]);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (err) {
    console.error('Error in sendMessage controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message with media upload
// @route   POST /api/messages/with-media
// @access  Private
exports.sendMessageWithMedia = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    try {
      const { receiverId, content, messageType, relatedBookingId, replyTo } = req.body;

      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found' });
      }

      // Process uploaded files
      const media = req.files ? req.files.map(file => ({
        type: getMediaType(file.mimetype),
        url: `/uploads/messages/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      })) : [];

      const message = new Message({
        sender: req.user.id,
        receiver: receiverId,
        messageType: messageType || (media.length > 0 ? media[0].type : 'text'),
        content,
        media,
        relatedBooking: relatedBookingId,
        replyTo,
        deliveryStatus: 'sent'
      });

      await message.save();

      await message.populate([
        { path: 'sender', select: 'firstName lastName profileImage' },
        { path: 'receiver', select: 'firstName lastName profileImage' }
      ]);

      res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } catch (err) {
      console.error('Error sending message with media:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// @desc    Get conversation
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ],
      isDeleted: false
    })
      .populate('sender', 'firstName lastName profileImage')
      .populate('receiver', 'firstName lastName profileImage')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Mark received messages as delivered
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        deliveryStatus: 'sent'
      },
      {
        $set: {
          deliveryStatus: 'delivered',
          deliveredAt: new Date()
        }
      }
    );

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (err) {
    console.error('Error in getConversation controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get conversations list
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversationsList = async (req, res) => {
  try {
    // Aggregate to get latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user.id },
            { receiver: req.user.id }
          ],
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user.id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', req.user.id] },
                    { $eq: ['$readStatus', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const partner = await User.findById(conv._id)
          .select('firstName lastName profileImage');

        return {
          partnerId: conv._id,
          partner,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json(populatedConversations);
  } catch (err) {
    console.error('Error in getConversationsList controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      receiver: req.user.id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.markAsRead();
    await message.save();

    res.json({
      message: 'Message marked as read',
      readAt: message.readAt
    });
  } catch (err) {
    console.error('Error in markAsRead controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/conversation/:userId/read
// @access  Private
exports.markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Message.markConversationAsRead(userId, req.user.id);

    res.json({
      message: 'Conversation marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error marking conversation as read:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reaction
// @access  Private
exports.addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is part of the conversation
    if (message.sender.toString() !== req.user.id && message.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.addReaction(req.user.id, emoji);
    await message.save();

    await message.populate('reactions.user', 'firstName lastName');

    res.json({
      message: 'Reaction added successfully',
      reactions: message.reactions
    });
  } catch (err) {
    console.error('Error adding reaction:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:id/reaction
// @access  Private
exports.removeReaction = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.removeReaction(req.user.id);
    await message.save();

    res.json({
      message: 'Reaction removed successfully',
      reactions: message.reactions
    });
  } catch (err) {
    console.error('Error removing reaction:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      sender: req.user.id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    message.softDelete();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread messages count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Error getting unread count:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { query, userId } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const filter = {
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ],
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    if (userId) {
      filter.$and = [
        {
          $or: [
            { sender: req.user.id, receiver: userId },
            { sender: userId, receiver: req.user.id }
          ]
        }
      ];
    }

    const messages = await Message.find(filter)
      .populate('sender', 'firstName lastName')
      .populate('receiver', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (err) {
    console.error('Error searching messages:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to determine media type from mimetype
function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}

module.exports = exports;
