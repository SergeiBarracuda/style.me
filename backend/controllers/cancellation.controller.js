const CancellationPolicy = require('../models/CancellationPolicy');
const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// @desc    Create cancellation policy
// @route   POST /api/cancellation-policies
// @access  Private/Provider
exports.createPolicy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const policyData = {
      ...req.body,
      provider: providerProfile._id
    };

    const policy = new CancellationPolicy(policyData);

    await policy.save();

    res.status(201).json({
      message: 'Cancellation policy created successfully',
      policy
    });
  } catch (error) {
    console.error('Error creating cancellation policy:', error);
    res.status(500).json({ message: 'Error creating policy', error: error.message });
  }
};

// @desc    Get provider's cancellation policies
// @route   GET /api/cancellation-policies/my-policies
// @access  Private/Provider
exports.getProviderPolicies = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const policies = await CancellationPolicy.find({ provider: providerProfile._id })
      .populate('appliesTo', 'name price')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      count: policies.length,
      policies
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Error fetching policies', error: error.message });
  }
};

// @desc    Get cancellation policy by ID
// @route   GET /api/cancellation-policies/:id
// @access  Public
exports.getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await CancellationPolicy.findById(id)
      .populate('provider', 'businessName')
      .populate('appliesTo', 'name price description');

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    res.json({ policy });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ message: 'Error fetching policy', error: error.message });
  }
};

// @desc    Update cancellation policy
// @route   PUT /api/cancellation-policies/:id
// @access  Private/Provider
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const policy = await CancellationPolicy.findOne({
      _id: id,
      provider: providerProfile._id
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'provider' && key !== '_id') {
        policy[key] = req.body[key];
      }
    });

    policy.lastModified = new Date();

    await policy.save();

    res.json({
      message: 'Policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ message: 'Error updating policy', error: error.message });
  }
};

// @desc    Delete cancellation policy
// @route   DELETE /api/cancellation-policies/:id
// @access  Private/Provider
exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const policy = await CancellationPolicy.findOne({
      _id: id,
      provider: providerProfile._id
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await policy.deleteOne();

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ message: 'Error deleting policy', error: error.message });
  }
};

// @desc    Calculate cancellation penalty for a booking
// @route   POST /api/cancellation-policies/calculate-penalty
// @access  Private
exports.calculateCancellationPenalty = async (req, res) => {
  try {
    const { bookingId, cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('provider');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get cancellation policy
    const policy = await CancellationPolicy.findOne({
      provider: booking.provider._id,
      isActive: true,
      $or: [
        { appliesTo: booking.service },
        { appliesTo: { $size: 0 } },
        { isDefault: true }
      ]
    }).sort({ isDefault: 1 });

    if (!policy) {
      return res.status(404).json({ message: 'No cancellation policy found for this provider' });
    }

    // Check for exception
    if (cancellationReason) {
      const exception = policy.applyException(cancellationReason, booking.price);
      if (exception) {
        return res.json({
          ...exception,
          policy: {
            name: policy.name,
            description: policy.description
          }
        });
      }
    }

    // Calculate standard penalty
    const cancellationTime = new Date();
    const penalty = policy.calculatePenalty(booking, cancellationTime);

    res.json({
      ...penalty,
      policy: {
        name: policy.name,
        description: policy.description
      }
    });
  } catch (error) {
    console.error('Error calculating penalty:', error);
    res.status(500).json({ message: 'Error calculating penalty', error: error.message });
  }
};

// @desc    Check if rescheduling is allowed for a booking
// @route   POST /api/cancellation-policies/check-reschedule
// @access  Private
exports.checkRescheduleEligibility = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('provider');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const policy = await CancellationPolicy.findOne({
      provider: booking.provider._id,
      isActive: true
    }).sort({ isDefault: 1 });

    if (!policy) {
      return res.status(404).json({ message: 'No cancellation policy found' });
    }

    const rescheduleCount = booking.rescheduleCount || 0;
    const result = policy.canReschedule(booking, rescheduleCount);

    res.json(result);
  } catch (error) {
    console.error('Error checking reschedule eligibility:', error);
    res.status(500).json({ message: 'Error checking eligibility', error: error.message });
  }
};

// @desc    Apply cancellation to booking
// @route   POST /api/cancellation-policies/apply-cancellation
// @access  Private
exports.applyCancellation = async (req, res) => {
  try {
    const { bookingId, cancellationReason, notes } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate('provider')
      .populate('client');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization
    const isClient = booking.client._id.toString() === userId;
    const providerProfile = await ProviderProfile.findOne({ user: userId });
    const isProvider = providerProfile && booking.provider._id.toString() === providerProfile._id.toString();

    if (!isClient && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Get cancellation policy
    const policy = await CancellationPolicy.findOne({
      provider: booking.provider._id,
      isActive: true
    }).sort({ isDefault: 1 });

    if (!policy) {
      return res.status(404).json({ message: 'No cancellation policy found' });
    }

    // Calculate penalty
    let penaltyInfo;
    if (cancellationReason) {
      penaltyInfo = policy.applyException(cancellationReason, booking.price);
    }

    if (!penaltyInfo) {
      const cancellationTime = new Date();
      penaltyInfo = policy.calculatePenalty(booking, cancellationTime);
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason || 'User cancelled';
    booking.cancellationNotes = notes;
    booking.cancellationDate = new Date();
    booking.cancellationBy = userId;
    booking.cancellationPenalty = penaltyInfo.penalty;
    booking.refundAmount = penaltyInfo.refund;

    await booking.save();

    // Process refund if applicable
    if (penaltyInfo.refund > 0) {
      const payment = await Payment.findOne({ booking: bookingId });
      if (payment && payment.status === 'completed') {
        payment.refundAmount = penaltyInfo.refund;
        payment.refundReason = penaltyInfo.reason;
        payment.refundStatus = 'pending';
        await payment.save();
        // Actual refund processing would happen here via Stripe
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking,
      penalty: penaltyInfo.penalty,
      refund: penaltyInfo.refund,
      refundPercentage: penaltyInfo.refundPercentage,
      reason: penaltyInfo.reason
    });
  } catch (error) {
    console.error('Error applying cancellation:', error);
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
};

// @desc    Mark booking as no-show
// @route   POST /api/cancellation-policies/mark-no-show
// @access  Private/Provider
exports.markAsNoShow = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const booking = await Booking.findById(bookingId).populate('provider');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.provider._id.toString() !== providerProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get policy
    const policy = await CancellationPolicy.findOne({
      provider: providerProfile._id,
      isActive: true
    });

    if (!policy) {
      return res.status(404).json({ message: 'No cancellation policy found' });
    }

    // Calculate no-show penalty
    const penaltyInfo = policy.calculateNoShowPenalty(booking.price);

    // Update booking
    booking.status = 'no-show';
    booking.cancellationPenalty = penaltyInfo.penalty;
    booking.refundAmount = penaltyInfo.refund;
    booking.cancellationDate = new Date();

    await booking.save();

    res.json({
      message: 'Booking marked as no-show',
      booking,
      penalty: penaltyInfo.penalty,
      refund: penaltyInfo.refund
    });
  } catch (error) {
    console.error('Error marking no-show:', error);
    res.status(500).json({ message: 'Error marking no-show', error: error.message });
  }
};

// @desc    Get default policy template
// @route   GET /api/cancellation-policies/template
// @access  Private/Provider
exports.getDefaultTemplate = async (req, res) => {
  try {
    const template = CancellationPolicy.getDefaultTemplate();

    res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Error fetching template', error: error.message });
  }
};

// @desc    Get cancellation statistics for provider
// @route   GET /api/cancellation-policies/statistics
// @access  Private/Provider
exports.getCancellationStatistics = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Get all bookings
    const allBookings = await Booking.find({ provider: providerProfile._id });

    const cancelled = allBookings.filter(b => b.status === 'cancelled');
    const noShows = allBookings.filter(b => b.status === 'no-show');

    const totalCancellations = cancelled.length + noShows.length;
    const cancellationRate = allBookings.length > 0
      ? (totalCancellations / allBookings.length) * 100
      : 0;

    const totalPenaltiesCollected = [...cancelled, ...noShows]
      .reduce((sum, b) => sum + (b.cancellationPenalty || 0), 0);

    const totalRefundsIssued = [...cancelled, ...noShows]
      .reduce((sum, b) => sum + (b.refundAmount || 0), 0);

    // Cancellation reasons breakdown
    const reasonBreakdown = {};
    cancelled.forEach(b => {
      const reason = b.cancellationReason || 'Not specified';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    // Time-based analysis
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentCancellations = cancelled.filter(b => b.cancellationDate >= last30Days);

    res.json({
      totalBookings: allBookings.length,
      totalCancellations,
      cancellationRate: cancellationRate.toFixed(2) + '%',
      cancelled: cancelled.length,
      noShows: noShows.length,
      totalPenaltiesCollected,
      totalRefundsIssued,
      reasonBreakdown,
      recentCancellations: recentCancellations.length,
      averagePenalty: totalCancellations > 0
        ? (totalPenaltiesCollected / totalCancellations).toFixed(2)
        : 0
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

module.exports = exports;
