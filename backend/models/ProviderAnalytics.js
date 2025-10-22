const mongoose = require('mongoose');

const providerAnalyticsSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true,
    unique: true
  },
  // Revenue metrics
  revenue: {
    total: {
      type: Number,
      default: 0
    },
    currentMonth: {
      type: Number,
      default: 0
    },
    lastMonth: {
      type: Number,
      default: 0
    },
    currentYear: {
      type: Number,
      default: 0
    },
    lastYear: {
      type: Number,
      default: 0
    },
    // Monthly breakdown for the last 12 months
    monthlyBreakdown: [{
      month: String, // Format: "YYYY-MM"
      revenue: Number,
      bookings: Number,
      completedBookings: Number,
      cancelledBookings: Number
    }]
  },
  // Booking metrics
  bookings: {
    total: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    cancelled: {
      type: Number,
      default: 0
    },
    upcoming: {
      type: Number,
      default: 0
    },
    currentMonth: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageValue: {
      type: Number,
      default: 0
    }
  },
  // Client metrics
  clients: {
    total: {
      type: Number,
      default: 0
    },
    newThisMonth: {
      type: Number,
      default: 0
    },
    returning: {
      type: Number,
      default: 0
    },
    retentionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Rating and reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total: {
      type: Number,
      default: 0
    },
    breakdown: {
      fiveStars: { type: Number, default: 0 },
      fourStars: { type: Number, default: 0 },
      threeStars: { type: Number, default: 0 },
      twoStars: { type: Number, default: 0 },
      oneStar: { type: Number, default: 0 }
    },
    recentTrend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing'],
      default: 'stable'
    }
  },
  // Response metrics
  response: {
    averageTime: {
      type: Number, // in minutes
      default: 0
    },
    rate: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Service performance
  popularServices: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    name: String,
    bookingCount: Number,
    revenue: Number
  }],
  // Peak times
  peakHours: [{
    hour: Number, // 0-23
    bookingCount: Number
  }],
  peakDays: [{
    day: String, // Monday-Sunday
    bookingCount: Number
  }],
  // Growth metrics
  growth: {
    revenueGrowth: {
      type: Number, // percentage change month-over-month
      default: 0
    },
    bookingGrowth: {
      type: Number, // percentage change month-over-month
      default: 0
    },
    clientGrowth: {
      type: Number, // percentage change month-over-month
      default: 0
    }
  },
  // Financial metrics
  financial: {
    averageCommissionRate: {
      type: Number,
      default: 15
    },
    totalCommissionPaid: {
      type: Number,
      default: 0
    },
    netEarnings: {
      type: Number,
      default: 0
    },
    pendingPayouts: {
      type: Number,
      default: 0
    },
    paidOut: {
      type: Number,
      default: 0
    }
  },
  // Last update timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
providerAnalyticsSchema.index({ provider: 1 });
providerAnalyticsSchema.index({ lastUpdated: 1 });

// Method to calculate growth rates
providerAnalyticsSchema.methods.calculateGrowth = function() {
  const currentMonth = this.revenue.currentMonth;
  const lastMonth = this.revenue.lastMonth;

  if (lastMonth > 0) {
    this.growth.revenueGrowth = ((currentMonth - lastMonth) / lastMonth) * 100;
  }

  // Get current and last month booking counts
  const breakdown = this.revenue.monthlyBreakdown;
  if (breakdown.length >= 2) {
    const current = breakdown[breakdown.length - 1];
    const previous = breakdown[breakdown.length - 2];

    if (previous.bookings > 0) {
      this.growth.bookingGrowth = ((current.bookings - previous.bookings) / previous.bookings) * 100;
    }
  }
};

// Method to update completion rate
providerAnalyticsSchema.methods.updateCompletionRate = function() {
  const total = this.bookings.completed + this.bookings.cancelled;
  if (total > 0) {
    this.bookings.completionRate = (this.bookings.completed / total) * 100;
  }
};

// Method to update average booking value
providerAnalyticsSchema.methods.updateAverageValue = function() {
  if (this.bookings.completed > 0) {
    this.bookings.averageValue = this.revenue.total / this.bookings.completed;
  }
};

// Method to update retention rate
providerAnalyticsSchema.methods.updateRetentionRate = function() {
  if (this.clients.total > 0) {
    this.clients.retentionRate = (this.clients.returning / this.clients.total) * 100;
  }
};

// Method to determine rating trend
providerAnalyticsSchema.methods.updateRatingTrend = function(recentRatings) {
  if (recentRatings.length < 10) {
    this.ratings.recentTrend = 'stable';
    return;
  }

  const halfPoint = Math.floor(recentRatings.length / 2);
  const firstHalf = recentRatings.slice(0, halfPoint);
  const secondHalf = recentRatings.slice(halfPoint);

  const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;

  if (secondAvg > firstAvg + 0.2) {
    this.ratings.recentTrend = 'increasing';
  } else if (secondAvg < firstAvg - 0.2) {
    this.ratings.recentTrend = 'decreasing';
  } else {
    this.ratings.recentTrend = 'stable';
  }
};

// Static method to initialize analytics for a provider
providerAnalyticsSchema.statics.initializeForProvider = async function(providerId) {
  const existing = await this.findOne({ provider: providerId });
  if (existing) {
    return existing;
  }

  const analytics = new this({
    provider: providerId,
    lastUpdated: new Date()
  });

  await analytics.save();
  return analytics;
};

const ProviderAnalytics = mongoose.model('ProviderAnalytics', providerAnalyticsSchema);

module.exports = ProviderAnalytics;
