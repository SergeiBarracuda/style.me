const LoyaltyProgram = require('../models/LoyaltyProgram');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');

// @desc    Get user's loyalty program
// @route   GET /api/loyalty
// @access  Private
exports.getLoyaltyProgram = async (req, res) => {
  try {
    const userId = req.user.id;

    let loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    // Create loyalty program if it doesn't exist
    if (!loyaltyProgram) {
      loyaltyProgram = new LoyaltyProgram({ user: userId });
      await loyaltyProgram.save();
    }

    // Get tier benefits
    const benefits = LoyaltyProgram.getTierBenefits(loyaltyProgram.tier);

    // Get active rewards
    const activeRewards = loyaltyProgram.getActiveRewards();

    res.json({
      loyaltyProgram,
      benefits,
      activeRewards
    });
  } catch (error) {
    console.error('Error fetching loyalty program:', error);
    res.status(500).json({ message: 'Error fetching loyalty program', error: error.message });
  }
};

// @desc    Get loyalty program statistics
// @route   GET /api/loyalty/stats
// @access  Private
exports.getLoyaltyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    if (!loyaltyProgram) {
      return res.status(404).json({ message: 'Loyalty program not found' });
    }

    // Calculate points earned in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPointsEarned = loyaltyProgram.pointsHistory
      .filter(entry => entry.type === 'earned' && entry.date >= thirtyDaysAgo)
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Calculate points redeemed in last 30 days
    const recentPointsRedeemed = loyaltyProgram.pointsHistory
      .filter(entry => entry.type === 'redeemed' && entry.date >= thirtyDaysAgo)
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

    // Points needed for next tier
    let pointsToNextTier = null;
    let nextTier = null;

    const tierThresholds = {
      bronze: { points: 0, spending: 0, next: 'silver' },
      silver: { points: 2000, spending: 500, next: 'gold' },
      gold: { points: 5000, spending: 2000, next: 'platinum' },
      platinum: { points: 10000, spending: 5000, next: null }
    };

    const currentTierInfo = tierThresholds[loyaltyProgram.tier];
    if (currentTierInfo.next) {
      nextTier = currentTierInfo.next;
      const nextTierInfo = tierThresholds[nextTier];
      const pointsNeeded = Math.max(0, nextTierInfo.points - loyaltyProgram.points);
      const spendingNeeded = Math.max(0, nextTierInfo.spending - loyaltyProgram.totalSpent);
      pointsToNextTier = {
        tier: nextTier,
        pointsNeeded,
        spendingNeeded,
        estimatedBookings: Math.ceil(spendingNeeded / 100) // Assuming average booking of $100
      };
    }

    res.json({
      currentTier: loyaltyProgram.tier,
      points: loyaltyProgram.points,
      totalSpent: loyaltyProgram.totalSpent,
      totalBookings: loyaltyProgram.totalBookings,
      recentActivity: {
        pointsEarned: recentPointsEarned,
        pointsRedeemed: recentPointsRedeemed,
        netPoints: recentPointsEarned - recentPointsRedeemed
      },
      progression: pointsToNextTier,
      tierUpgradedAt: loyaltyProgram.tierUpgradedAt,
      lastActivityAt: loyaltyProgram.lastActivityAt
    });
  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    res.status(500).json({ message: 'Error fetching loyalty stats', error: error.message });
  }
};

// @desc    Get points history
// @route   GET /api/loyalty/history
// @access  Private
exports.getPointsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type } = req.query;

    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId })
      .populate('pointsHistory.booking', 'bookingId service totalAmount');

    if (!loyaltyProgram) {
      return res.status(404).json({ message: 'Loyalty program not found' });
    }

    let history = loyaltyProgram.pointsHistory;

    // Filter by type if specified
    if (type) {
      history = history.filter(entry => entry.type === type);
    }

    // Sort by date (most recent first)
    history.sort((a, b) => b.date - a.date);

    // Paginate
    const total = history.length;
    const paginatedHistory = history.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      history: paginatedHistory
    });
  } catch (error) {
    console.error('Error fetching points history:', error);
    res.status(500).json({ message: 'Error fetching points history', error: error.message });
  }
};

// @desc    Get available rewards
// @route   GET /api/loyalty/rewards
// @access  Private
exports.getAvailableRewards = async (req, res) => {
  try {
    const userId = req.user.id;

    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    if (!loyaltyProgram) {
      return res.status(404).json({ message: 'Loyalty program not found' });
    }

    const activeRewards = loyaltyProgram.getActiveRewards();

    // Sort by expiry date (soonest first)
    activeRewards.sort((a, b) => a.expiryDate - b.expiryDate);

    res.json({
      count: activeRewards.length,
      rewards: activeRewards
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Error fetching rewards', error: error.message });
  }
};

// @desc    Redeem points for reward
// @route   POST /api/loyalty/redeem
// @access  Private
exports.redeemPoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { points, rewardType, rewardValue, reason } = req.body;

    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    if (!loyaltyProgram) {
      return res.status(404).json({ message: 'Loyalty program not found' });
    }

    // Check if user has enough points
    if (loyaltyProgram.points < points) {
      return res.status(400).json({
        message: 'Insufficient points',
        available: loyaltyProgram.points,
        required: points
      });
    }

    // Redeem points
    loyaltyProgram.redeemPoints(points, reason || 'Points redemption');

    // Add reward
    loyaltyProgram.addReward(rewardType, rewardValue);

    await loyaltyProgram.save();

    res.json({
      message: 'Points redeemed successfully',
      pointsRedeemed: points,
      remainingPoints: loyaltyProgram.points,
      reward: {
        type: rewardType,
        value: rewardValue
      }
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ message: error.message || 'Error redeeming points' });
  }
};

// @desc    Use reward
// @route   POST /api/loyalty/rewards/:rewardId/use
// @access  Private
exports.useReward = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rewardId } = req.params;
    const { bookingId } = req.body;

    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    if (!loyaltyProgram) {
      return res.status(404).json({ message: 'Loyalty program not found' });
    }

    // Find the reward
    const reward = loyaltyProgram.availableRewards.id(rewardId);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Check if reward is already used
    if (reward.isUsed) {
      return res.status(400).json({ message: 'Reward has already been used' });
    }

    // Check if reward is expired
    if (reward.expiryDate < new Date()) {
      return res.status(400).json({ message: 'Reward has expired' });
    }

    // Mark reward as used
    reward.isUsed = true;
    reward.usedAt = new Date();
    reward.usedInBooking = bookingId;

    await loyaltyProgram.save();

    res.json({
      message: 'Reward used successfully',
      reward
    });
  } catch (error) {
    console.error('Error using reward:', error);
    res.status(500).json({ message: 'Error using reward', error: error.message });
  }
};

// @desc    Award points for booking (Admin/System)
// @route   POST /api/loyalty/award
// @access  Private/Admin
exports.awardPoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, amount, reason, bookingId } = req.body;

    let loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    // Create loyalty program if it doesn't exist
    if (!loyaltyProgram) {
      loyaltyProgram = new LoyaltyProgram({ user: userId });
    }

    // Add points
    loyaltyProgram.addPoints(amount, reason, bookingId);

    await loyaltyProgram.save();

    res.json({
      message: 'Points awarded successfully',
      pointsAwarded: amount,
      totalPoints: loyaltyProgram.points,
      tier: loyaltyProgram.tier
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: 'Error awarding points', error: error.message });
  }
};

// @desc    Get tier benefits
// @route   GET /api/loyalty/tiers
// @access  Public
exports.getTierBenefits = async (req, res) => {
  try {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const tierInfo = tiers.map(tier => ({
      tier,
      benefits: LoyaltyProgram.getTierBenefits(tier),
      thresholds: getTierThresholds(tier)
    }));

    res.json({ tiers: tierInfo });
  } catch (error) {
    console.error('Error fetching tier benefits:', error);
    res.status(500).json({ message: 'Error fetching tier benefits', error: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/loyalty/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 50, tier } = req.query;

    const filter = {};
    if (tier) {
      filter.tier = tier;
    }

    const leaderboard = await LoyaltyProgram.find(filter)
      .sort({ points: -1 })
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName profileImage')
      .select('user points tier totalSpent totalBookings');

    // Find current user's rank
    const userId = req.user.id;
    const userProgram = await LoyaltyProgram.findOne({ user: userId });

    let userRank = null;
    if (userProgram) {
      const higherRanked = await LoyaltyProgram.countDocuments({
        points: { $gt: userProgram.points }
      });
      userRank = higherRanked + 1;
    }

    res.json({
      leaderboard,
      userRank,
      totalUsers: await LoyaltyProgram.countDocuments()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

// @desc    Update user's spending and bookings (triggered by booking completion)
// @route   POST /api/loyalty/update-spending
// @access  Private/System
exports.updateSpending = async (req, res) => {
  try {
    const { userId, amount, bookingId } = req.body;

    let loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    // Create loyalty program if it doesn't exist
    if (!loyaltyProgram) {
      loyaltyProgram = new LoyaltyProgram({ user: userId });
    }

    // Update spending and booking count
    loyaltyProgram.totalSpent += amount;
    loyaltyProgram.totalBookings += 1;

    // Calculate and add points
    const pointsToAdd = LoyaltyProgram.calculatePointsFromBooking(amount);
    const benefits = LoyaltyProgram.getTierBenefits(loyaltyProgram.tier);
    const multipliedPoints = Math.floor(pointsToAdd * benefits.pointsMultiplier);

    loyaltyProgram.addPoints(
      multipliedPoints,
      `Booking completed - ${benefits.pointsMultiplier}x multiplier`,
      bookingId
    );

    await loyaltyProgram.save();

    res.json({
      message: 'Spending updated successfully',
      pointsEarned: multipliedPoints,
      totalPoints: loyaltyProgram.points,
      tier: loyaltyProgram.tier,
      totalSpent: loyaltyProgram.totalSpent
    });
  } catch (error) {
    console.error('Error updating spending:', error);
    res.status(500).json({ message: 'Error updating spending', error: error.message });
  }
};

// Helper function to get tier thresholds
function getTierThresholds(tier) {
  const thresholds = {
    bronze: {
      pointsRequired: 0,
      spendingRequired: 0
    },
    silver: {
      pointsRequired: 2000,
      spendingRequired: 500
    },
    gold: {
      pointsRequired: 5000,
      spendingRequired: 2000
    },
    platinum: {
      pointsRequired: 10000,
      spendingRequired: 5000
    }
  };

  return thresholds[tier] || thresholds.bronze;
}

module.exports = exports;
