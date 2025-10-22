const Dispute = require('../models/Dispute');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// @desc    Create a new dispute
// @route   POST /api/disputes
// @access  Private
exports.createDispute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      bookingId,
      category,
      subject,
      description,
      evidence,
      refundRequested,
      refundAmount
    } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('provider', 'user')
      .populate('client');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Determine initiator and respondent
    const userId = req.user.id;
    let initiatorType, respondentType, respondentId;

    if (booking.client._id.toString() === userId) {
      initiatorType = 'client';
      respondentType = 'provider';
      respondentId = booking.provider.user;
    } else {
      const providerProfile = await ProviderProfile.findOne({ user: userId });
      if (!providerProfile || booking.provider._id.toString() !== providerProfile._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to create a dispute for this booking' });
      }
      initiatorType = 'provider';
      respondentType = 'client';
      respondentId = booking.client._id;
    }

    // Check if dispute already exists for this booking
    const existingDispute = await Dispute.findOne({
      booking: bookingId,
      status: { $nin: ['closed', 'resolved'] }
    });

    if (existingDispute) {
      return res.status(400).json({ message: 'An active dispute already exists for this booking' });
    }

    // Create dispute
    const dispute = new Dispute({
      booking: bookingId,
      initiator: userId,
      initiatorType,
      respondent: respondentId,
      respondentType,
      category,
      subject,
      description,
      evidence: evidence || [],
      refundRequested: refundRequested || false,
      refundAmount: refundAmount || 0,
      refundStatus: refundRequested ? 'pending' : 'not_requested',
      status: 'open',
      priority: determinePriority(category, refundRequested)
    });

    dispute.addTimelineEvent(
      'dispute_created',
      `Dispute created by ${initiatorType}`,
      userId
    );

    await dispute.save();

    // Update booking status
    booking.status = 'disputed';
    await booking.save();

    res.status(201).json({
      message: 'Dispute created successfully',
      dispute
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ message: 'Error creating dispute', error: error.message });
  }
};

// @desc    Get user's disputes
// @route   GET /api/disputes/my-disputes
// @access  Private
exports.getUserDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {
      $or: [
        { initiator: userId },
        { respondent: userId }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const disputes = await Dispute.find(filter)
      .populate('booking', 'bookingId service scheduledDate')
      .populate('initiator', 'firstName lastName email profileImage')
      .populate('respondent', 'firstName lastName email profileImage')
      .populate('assignedAdmin', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Dispute.countDocuments(filter);

    res.json({
      disputes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user disputes:', error);
    res.status(500).json({ message: 'Error fetching disputes', error: error.message });
  }
};

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
// @access  Private
exports.getDisputeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id)
      .populate('booking')
      .populate('initiator', 'firstName lastName email profileImage')
      .populate('respondent', 'firstName lastName email profileImage')
      .populate('assignedAdmin', 'firstName lastName email')
      .populate('responses.user', 'firstName lastName profileImage')
      .populate('resolution.resolvedBy', 'firstName lastName');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check authorization
    const user = await User.findById(userId);
    const isParty = dispute.initiator._id.toString() === userId ||
                    dispute.respondent._id.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isParty && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to view this dispute' });
    }

    res.json({ dispute });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({ message: 'Error fetching dispute', error: error.message });
  }
};

// @desc    Add response to dispute
// @route   POST /api/disputes/:id/respond
// @access  Private
exports.addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check authorization
    const user = await User.findById(userId);
    const isParty = dispute.initiator.toString() === userId ||
                    dispute.respondent.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isParty && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to respond to this dispute' });
    }

    // Determine user type
    let userType;
    if (isAdmin) {
      userType = 'admin';
    } else if (dispute.initiator.toString() === userId) {
      userType = dispute.initiatorType;
    } else {
      userType = dispute.respondentType;
    }

    dispute.addResponse(userId, userType, message, attachments || []);

    await dispute.save();

    res.json({
      message: 'Response added successfully',
      dispute
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Error adding response', error: error.message });
  }
};

// @desc    Get all disputes (Admin)
// @route   GET /api/disputes/admin/all
// @access  Private/Admin
exports.getAllDisputes = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const disputes = await Dispute.find(filter)
      .populate('booking', 'bookingId service scheduledDate')
      .populate('initiator', 'firstName lastName email')
      .populate('respondent', 'firstName lastName email')
      .populate('assignedAdmin', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Dispute.countDocuments(filter);
    const stats = await Dispute.getStatistics();

    res.json({
      disputes,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all disputes:', error);
    res.status(500).json({ message: 'Error fetching disputes', error: error.message });
  }
};

// @desc    Assign dispute to admin
// @route   POST /api/disputes/:id/assign
// @access  Private/Admin
exports.assignDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Verify the admin exists
    const admin = await User.findById(adminId || userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin user' });
    }

    dispute.assignToAdmin(adminId || userId, userId);

    await dispute.save();

    res.json({
      message: 'Dispute assigned successfully',
      dispute
    });
  } catch (error) {
    console.error('Error assigning dispute:', error);
    res.status(500).json({ message: 'Error assigning dispute', error: error.message });
  }
};

// @desc    Escalate dispute
// @route   POST /api/disputes/:id/escalate
// @access  Private/Admin
exports.escalateDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    dispute.escalate(reason, userId);

    await dispute.save();

    res.json({
      message: 'Dispute escalated successfully',
      dispute
    });
  } catch (error) {
    console.error('Error escalating dispute:', error);
    res.status(500).json({ message: 'Error escalating dispute', error: error.message });
  }
};

// @desc    Resolve dispute
// @route   POST /api/disputes/:id/resolve
// @access  Private/Admin
exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionType, description, refundAmount, notes } = req.body;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id).populate('booking');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Resolve the dispute
    dispute.resolve(resolutionType, description, userId);

    // Handle refund if applicable
    if (resolutionType === 'refund_issued' || resolutionType === 'partial_refund') {
      const payment = await Payment.findOne({ booking: dispute.booking._id });

      if (payment && payment.stripePaymentIntentId) {
        dispute.refundStatus = 'approved';
        dispute.refundAmount = refundAmount || dispute.refundAmount;

        // Note: Actual Stripe refund would be processed here
        // For now, we just update the status
      }
    }

    // Add notes if provided
    if (notes) {
      dispute.adminNotes.push({
        admin: userId,
        note: notes,
        createdAt: new Date()
      });
    }

    await dispute.save();

    // Update booking status if needed
    if (dispute.booking.status === 'disputed') {
      const booking = await Booking.findById(dispute.booking._id);
      booking.status = 'completed';
      await booking.save();
    }

    res.json({
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ message: 'Error resolving dispute', error: error.message });
  }
};

// @desc    Close dispute
// @route   POST /api/disputes/:id/close
// @access  Private/Admin
exports.closeDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    dispute.close(reason, userId);

    await dispute.save();

    res.json({
      message: 'Dispute closed successfully',
      dispute
    });
  } catch (error) {
    console.error('Error closing dispute:', error);
    res.status(500).json({ message: 'Error closing dispute', error: error.message });
  }
};

// @desc    Submit satisfaction rating
// @route   POST /api/disputes/:id/rate
// @access  Private
exports.submitSatisfactionRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    const dispute = await Dispute.findById(id);

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status !== 'resolved' && dispute.status !== 'closed') {
      return res.status(400).json({ message: 'Dispute must be resolved or closed to rate' });
    }

    // Determine if user is initiator or respondent
    if (dispute.initiator.toString() === userId) {
      dispute.satisfactionRating.initiator = rating;
    } else if (dispute.respondent.toString() === userId) {
      dispute.satisfactionRating.respondent = rating;
    } else {
      return res.status(403).json({ message: 'You are not authorized to rate this dispute' });
    }

    await dispute.save();

    res.json({
      message: 'Satisfaction rating submitted successfully',
      dispute
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
};

// @desc    Get dispute statistics
// @route   GET /api/disputes/admin/statistics
// @access  Private/Admin
exports.getDisputeStatistics = async (req, res) => {
  try {
    const stats = await Dispute.getStatistics();
    const averageResolutionTime = await Dispute.getAverageResolutionTime();

    // Get disputes by category
    const categoryBreakdown = await Dispute.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get disputes by status
    const statusBreakdown = await Dispute.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get resolution types
    const resolutionBreakdown = await Dispute.aggregate([
      {
        $match: { 'resolution.type': { $exists: true } }
      },
      {
        $group: {
          _id: '$resolution.type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      ...stats,
      averageResolutionTime: `${averageResolutionTime} hours`,
      categoryBreakdown,
      statusBreakdown,
      resolutionBreakdown
    });
  } catch (error) {
    console.error('Error fetching dispute statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// Helper function to determine dispute priority
function determinePriority(category, refundRequested) {
  const highPriorityCategories = ['safety_concern', 'no_show', 'service_not_provided'];

  if (highPriorityCategories.includes(category)) {
    return 'high';
  }

  if (refundRequested) {
    return 'medium';
  }

  return 'low';
}

module.exports = exports;
