const mongoose = require('mongoose');

const loyaltyProgramSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Points and tier
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  // Spending tracking
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  // Rewards
  availableRewards: [{
    rewardType: {
      type: String,
      enum: ['discount', 'free_service', 'priority_booking', 'cashback']
    },
    value: Number,
    expiryDate: Date,
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: Date,
    usedInBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  // History
  pointsHistory: [{
    amount: Number,
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'bonus']
    },
    reason: String,
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Tier upgrade dates
  tierUpgradedAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
loyaltyProgramSchema.index({ user: 1 });
loyaltyProgramSchema.index({ tier: 1, points: -1 });

// Method to add points
loyaltyProgramSchema.methods.addPoints = function(amount, reason, bookingId) {
  this.points += amount;
  this.pointsHistory.push({
    amount,
    type: 'earned',
    reason,
    booking: bookingId,
    date: new Date()
  });
  this.lastActivityAt = new Date();

  // Check for tier upgrade
  this.updateTier();
};

// Method to redeem points
loyaltyProgramSchema.methods.redeemPoints = function(amount, reason, bookingId) {
  if (this.points < amount) {
    throw new Error('Insufficient points');
  }

  this.points -= amount;
  this.pointsHistory.push({
    amount: -amount,
    type: 'redeemed',
    reason,
    booking: bookingId,
    date: new Date()
  });
  this.lastActivityAt = new Date();
};

// Method to update tier based on points and spending
loyaltyProgramSchema.methods.updateTier = function() {
  const oldTier = this.tier;

  // Tier thresholds
  if (this.totalSpent >= 5000 || this.points >= 10000) {
    this.tier = 'platinum';
  } else if (this.totalSpent >= 2000 || this.points >= 5000) {
    this.tier = 'gold';
  } else if (this.totalSpent >= 500 || this.points >= 2000) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }

  // If tier upgraded, record the date
  if (this.tier !== oldTier) {
    this.tierUpgradedAt = new Date();

    // Add bonus points for tier upgrade
    const bonusPoints = {
      silver: 100,
      gold: 300,
      platinum: 1000
    };

    if (bonusPoints[this.tier]) {
      this.points += bonusPoints[this.tier];
      this.pointsHistory.push({
        amount: bonusPoints[this.tier],
        type: 'bonus',
        reason: `Tier upgrade to ${this.tier}`,
        date: new Date()
      });
    }
  }
};

// Method to add reward
loyaltyProgramSchema.methods.addReward = function(rewardType, value, expiryDays = 90) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  this.availableRewards.push({
    rewardType,
    value,
    expiryDate,
    isUsed: false
  });
};

// Method to get active rewards
loyaltyProgramSchema.methods.getActiveRewards = function() {
  const now = new Date();
  return this.availableRewards.filter(
    reward => !reward.isUsed && reward.expiryDate > now
  );
};

// Static method to calculate points from booking
loyaltyProgramSchema.statics.calculatePointsFromBooking = function(amount) {
  // 1 point per $1 spent
  return Math.floor(amount);
};

// Static method to get tier benefits
loyaltyProgramSchema.statics.getTierBenefits = function(tier) {
  const benefits = {
    bronze: {
      pointsMultiplier: 1,
      commissionDiscount: 0,
      prioritySupport: false,
      exclusiveDeals: false
    },
    silver: {
      pointsMultiplier: 1.25,
      commissionDiscount: 2,
      prioritySupport: false,
      exclusiveDeals: true
    },
    gold: {
      pointsMultiplier: 1.5,
      commissionDiscount: 5,
      prioritySupport: true,
      exclusiveDeals: true
    },
    platinum: {
      pointsMultiplier: 2,
      commissionDiscount: 10,
      prioritySupport: true,
      exclusiveDeals: true
    }
  };

  return benefits[tier] || benefits.bronze;
};

const LoyaltyProgram = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);

module.exports = LoyaltyProgram;
