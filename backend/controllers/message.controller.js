const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, mediaUrl, relatedBookingId } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create new message
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content,
      mediaUrl,
      relatedBooking: relatedBookingId
    });

    // Save message
    await message.save();

    res.status(201).json(message);
  } catch (err) {
    console.error('Error in sendMessage controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversation
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between users
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.user.id, readStatus: false },
      { readStatus: true }
    );

    res.json(messages);
  } catch (err) {
    console.error('Error in getConversation controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversations list
exports.getConversationsList = async (req, res) => {
  try {
    // Get all messages sent by or received by the user
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    // Extract unique conversation partners
    const conversationPartners = new Set();
    const conversations = [];

    messages.forEach(message => {
      const partnerId = message.sender.toString() === req.user.id ? 
        message.receiver.toString() : message.sender.toString();
      
      if (!conversationPartners.has(partnerId)) {
        conversationPartners.add(partnerId);
        conversations.push({
          partnerId,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    // Get unread count for each conversation
    for (let conversation of conversations) {
      conversation.unreadCount = await Message.countDocuments({
        sender: conversation.partnerId,
        receiver: req.user.id,
        readStatus: false
      });
    }

    // Populate user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const partner = await User.findById(conversation.partnerId)
          .select('firstName lastName profileImage');
        
        return {
          ...conversation,
          partner
        };
      })
    );

    res.json(populatedConversations);
  } catch (err) {
    console.error('Error in getConversationsList controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    // Update messages
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        receiver: req.user.id
      },
      { readStatus: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Error in markAsRead controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
