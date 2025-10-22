const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Message type and content
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'audio', 'location'],
    default: 'text'
  },
  content: {
    type: String,
    trim: true
  },
  // Enhanced media support
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'audio']
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number, // in bytes
    mimeType: String,
    thumbnail: String, // For videos and images
    duration: Number // For audio/video in seconds
  }],
  // Deprecated - keeping for backward compatibility
  mediaUrl: {
    type: String,
    trim: true
  },
  // Read receipts
  readStatus: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Delivery status
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  deliveredAt: {
    type: Date
  },
  // Reply/Thread support
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message status
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Related booking
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  // Quick reply buttons (for automated messages)
  quickReplies: [{
    text: String,
    action: String
  }],
  // Metadata
  metadata: {
    type: Map,
    of: String
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

// Create compound index for efficient querying of conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ readStatus: 1, receiver: 1 });
messageSchema.index({ deliveryStatus: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  if (!this.readStatus) {
    this.readStatus = true;
    this.readAt = new Date();
    this.deliveryStatus = 'read';
  }
};

// Method to mark message as delivered
messageSchema.methods.markAsDelivered = function() {
  if (this.deliveryStatus === 'sent') {
    this.deliveryStatus = 'delivered';
    this.deliveredAt = new Date();
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());

  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji,
    createdAt: new Date()
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
};

// Method to soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    readStatus: false,
    isDeleted: false
  });
};

// Static method to mark all messages as read in a conversation
messageSchema.statics.markConversationAsRead = async function(senderId, receiverId) {
  return await this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      readStatus: false
    },
    {
      $set: {
        readStatus: true,
        readAt: new Date(),
        deliveryStatus: 'read'
      }
    }
  );
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
