const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatorType: {
    type: String,
    enum: ['client', 'provider'],
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondentType: {
    type: String,
    enum: ['client', 'provider'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'service_not_provided',
      'service_incomplete',
      'service_quality',
      'late_arrival',
      'no_show',
      'payment_issue',
      'unprofessional_behavior',
      'safety_concern',
      'cancellation_dispute',
      'other'
    ],
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'message_screenshot']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  status: {
    type: String,
    enum: [
      'open',
      'under_review',
      'awaiting_response',
      'resolved',
      'closed',
      'escalated'
    ],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Responses and communication
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userType: {
      type: String,
      enum: ['client', 'provider', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    attachments: [{
      type: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Admin review
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Resolution
  resolution: {
    type: {
      type: String,
      enum: [
        'refund_issued',
        'partial_refund',
        'service_rescheduled',
        'warning_issued',
        'no_action',
        'account_suspended',
        'mediation_completed',
        'other'
      ]
    },
    description: String,
    refundAmount: Number,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    notes: String
  },
  // Financial impact
  refundRequested: {
    type: Boolean,
    default: false
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundStatus: {
    type: String,
    enum: ['not_requested', 'pending', 'approved', 'denied', 'processed'],
    default: 'not_requested'
  },
  // Timeline tracking
  timeline: [{
    event: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Closure
  closedAt: Date,
  closureReason: String,
  satisfactionRating: {
    initiator: {
      type: Number,
      min: 1,
      max: 5
    },
    respondent: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
disputeSchema.index({ booking: 1 });
disputeSchema.index({ initiator: 1 });
disputeSchema.index({ respondent: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ assignedAdmin: 1, status: 1 });

// Method to add timeline event
disputeSchema.methods.addTimelineEvent = function(event, description, userId) {
  this.timeline.push({
    event,
    description,
    performedBy: userId,
    timestamp: new Date()
  });
};

// Method to add response
disputeSchema.methods.addResponse = function(userId, userType, message, attachments = []) {
  this.responses.push({
    user: userId,
    userType,
    message,
    attachments,
    createdAt: new Date()
  });

  // Update status if needed
  if (this.status === 'awaiting_response') {
    this.status = 'under_review';
  }

  this.addTimelineEvent(
    'response_added',
    `New response from ${userType}`,
    userId
  );
};

// Method to assign admin
disputeSchema.methods.assignToAdmin = function(adminId, userId) {
  this.assignedAdmin = adminId;
  this.status = 'under_review';
  this.addTimelineEvent(
    'assigned_to_admin',
    'Dispute assigned to admin for review',
    userId
  );
};

// Method to escalate dispute
disputeSchema.methods.escalate = function(reason, userId) {
  this.status = 'escalated';
  this.priority = 'high';
  this.addTimelineEvent(
    'escalated',
    `Dispute escalated: ${reason}`,
    userId
  );
};

// Method to resolve dispute
disputeSchema.methods.resolve = function(resolutionType, description, adminId) {
  this.status = 'resolved';
  this.resolution = {
    type: resolutionType,
    description,
    resolvedBy: adminId,
    resolvedAt: new Date()
  };
  this.addTimelineEvent(
    'resolved',
    `Dispute resolved: ${resolutionType}`,
    adminId
  );
};

// Method to close dispute
disputeSchema.methods.close = function(reason, userId) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closureReason = reason;
  this.addTimelineEvent(
    'closed',
    `Dispute closed: ${reason}`,
    userId
  );
};

// Static method to get dispute statistics
disputeSchema.statics.getStatistics = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: {
          $sum: {
            $cond: [{ $in: ['$status', ['open', 'under_review', 'awaiting_response']] }, 1, 0]
          }
        },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        closed: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        refundsRequested: {
          $sum: { $cond: ['$refundRequested', 1, 0] }
        },
        totalRefundAmount: {
          $sum: { $cond: ['$refundRequested', '$refundAmount', 0] }
        }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    total: 0,
    open: 0,
    resolved: 0,
    closed: 0,
    refundsRequested: 0,
    totalRefundAmount: 0
  };
};

// Static method to get average resolution time
disputeSchema.statics.getAverageResolutionTime = async function() {
  const result = await this.aggregate([
    {
      $match: {
        status: 'resolved',
        'resolution.resolvedAt': { $exists: true }
      }
    },
    {
      $project: {
        resolutionTime: {
          $subtract: ['$resolution.resolvedAt', '$createdAt']
        }
      }
    },
    {
      $group: {
        _id: null,
        averageTime: { $avg: '$resolutionTime' }
      }
    }
  ]);

  return result.length > 0 ? Math.round(result[0].averageTime / (1000 * 60 * 60)) : 0; // Return in hours
};

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
