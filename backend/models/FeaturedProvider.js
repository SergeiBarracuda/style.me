const mongoose = require('mongoose');

const featuredProviderSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true,
    unique: true
  },
  // Featured status
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredType: {
    type: String,
    enum: ['automatic', 'manual', 'promoted'],
    default: 'automatic'
  },
  // Scoring factors
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scores: {
    // Rating score (0-25 points)
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 25
    },
    // Completion rate score (0-20 points)
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    // Experience score based on completed bookings (0-15 points)
    experience: {
      type: Number,
      default: 0,
      min: 0,
      max: 15
    },
    // Response score (0-15 points)
    responseMetrics: {
      type: Number,
      default: 0,
      min: 0,
      max: 15
    },
    // Client retention score (0-10 points)
    retention: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    // Loyalty tier bonus (0-10 points)
    loyaltyTier: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    // Activity recency (0-5 points)
    recency: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  // Ranking
  rank: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['hair', 'nails', 'makeup', 'spa', 'massage', 'skincare', 'other']
  },
  // Manual featured settings (admin)
  manuallyFeatured: {
    type: Boolean,
    default: false
  },
  manualFeaturedUntil: {
    type: Date
  },
  featuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Promoted featured (paid)
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionStartDate: {
    type: Date
  },
  promotionEndDate: {
    type: Date
  },
  promotionPriority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  // Display settings
  displayOrder: {
    type: Number,
    default: 0
  },
  featuredBadge: {
    type: String,
    enum: ['top_rated', 'highly_experienced', 'rising_star', 'best_value', 'quick_response', 'verified_pro'],
    default: 'top_rated'
  },
  // Statistics for featured placement
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  bookingsFromFeatured: {
    type: Number,
    default: 0
  },
  clickThroughRate: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  // Metadata
  lastScoreUpdate: {
    type: Date,
    default: Date.now
  },
  featuredSince: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
featuredProviderSchema.index({ isFeatured: 1, qualityScore: -1 });
featuredProviderSchema.index({ category: 1, qualityScore: -1 });
featuredProviderSchema.index({ rank: 1 });
featuredProviderSchema.index({ provider: 1 });

// Method to calculate quality score
featuredProviderSchema.methods.calculateQualityScore = function() {
  const { rating, completionRate, experience, responseMetrics, retention, loyaltyTier, recency } = this.scores;

  this.qualityScore = rating + completionRate + experience + responseMetrics + retention + loyaltyTier + recency;

  // Apply bonuses for manual or promoted
  if (this.manuallyFeatured && this.manualFeaturedUntil > new Date()) {
    this.qualityScore += 10;
  }

  if (this.isPromoted && this.promotionEndDate > new Date()) {
    this.qualityScore += this.promotionPriority * 5;
  }

  return this.qualityScore;
};

// Method to update featured status based on score
featuredProviderSchema.methods.updateFeaturedStatus = function(threshold = 70) {
  if (this.manuallyFeatured || this.isPromoted) {
    this.isFeatured = true;
    return;
  }

  this.isFeatured = this.qualityScore >= threshold;

  if (this.isFeatured && !this.featuredSince) {
    this.featuredSince = new Date();
  } else if (!this.isFeatured) {
    this.featuredSince = null;
  }
};

// Method to determine featured badge
featuredProviderSchema.methods.determineBadge = function() {
  // Top rated: rating score is highest component
  if (this.scores.rating >= 20) {
    this.featuredBadge = 'top_rated';
  }
  // Highly experienced: many completed bookings
  else if (this.scores.experience >= 12) {
    this.featuredBadge = 'highly_experienced';
  }
  // Quick response: excellent response metrics
  else if (this.scores.responseMetrics >= 12) {
    this.featuredBadge = 'quick_response';
  }
  // Rising star: newer but high quality
  else if (this.scores.recency >= 4 && this.qualityScore >= 70) {
    this.featuredBadge = 'rising_star';
  }
  // Verified pro: high loyalty tier
  else if (this.scores.loyaltyTier >= 8) {
    this.featuredBadge = 'verified_pro';
  }
  // Best value: good all-around
  else {
    this.featuredBadge = 'best_value';
  }
};

// Method to update click-through rate
featuredProviderSchema.methods.updateCTR = function() {
  if (this.impressions > 0) {
    this.clickThroughRate = (this.clicks / this.impressions) * 100;
  }
};

// Method to update conversion rate
featuredProviderSchema.methods.updateConversionRate = function() {
  if (this.clicks > 0) {
    this.conversionRate = (this.bookingsFromFeatured / this.clicks) * 100;
  }
};

// Method to track impression
featuredProviderSchema.methods.trackImpression = function() {
  this.impressions += 1;
  this.updateCTR();
};

// Method to track click
featuredProviderSchema.methods.trackClick = function() {
  this.clicks += 1;
  this.updateCTR();
  this.updateConversionRate();
};

// Method to track booking
featuredProviderSchema.methods.trackBooking = function() {
  this.bookingsFromFeatured += 1;
  this.updateConversionRate();
};

// Static method to calculate provider scores
featuredProviderSchema.statics.calculateProviderScores = async function(providerId, analytics) {
  const scores = {
    rating: 0,
    completionRate: 0,
    experience: 0,
    responseMetrics: 0,
    retention: 0,
    loyaltyTier: 0,
    recency: 0
  };

  // Rating score (0-25 points)
  // 4.5+ stars = 25 points, 4.0-4.5 = 20 points, 3.5-4.0 = 15 points, etc.
  const avgRating = analytics.ratings?.average || 0;
  if (avgRating >= 4.8) scores.rating = 25;
  else if (avgRating >= 4.5) scores.rating = 22;
  else if (avgRating >= 4.0) scores.rating = 18;
  else if (avgRating >= 3.5) scores.rating = 12;
  else if (avgRating >= 3.0) scores.rating = 6;

  // Completion rate score (0-20 points)
  const completionRate = analytics.bookings?.completionRate || 0;
  if (completionRate >= 95) scores.completionRate = 20;
  else if (completionRate >= 90) scores.completionRate = 17;
  else if (completionRate >= 85) scores.completionRate = 14;
  else if (completionRate >= 80) scores.completionRate = 10;
  else if (completionRate >= 75) scores.completionRate = 6;

  // Experience score (0-15 points)
  const completedBookings = analytics.bookings?.completed || 0;
  if (completedBookings >= 500) scores.experience = 15;
  else if (completedBookings >= 250) scores.experience = 13;
  else if (completedBookings >= 100) scores.experience = 11;
  else if (completedBookings >= 50) scores.experience = 9;
  else if (completedBookings >= 25) scores.experience = 6;
  else if (completedBookings >= 10) scores.experience = 3;

  // Response metrics score (0-15 points)
  const responseRate = analytics.response?.rate || 0;
  const avgResponseTime = analytics.response?.averageTime || 9999;
  let responseScore = 0;
  if (responseRate >= 95) responseScore += 8;
  else if (responseRate >= 90) responseScore += 6;
  else if (responseRate >= 85) responseScore += 4;

  if (avgResponseTime <= 30) responseScore += 7; // 30 minutes
  else if (avgResponseTime <= 60) responseScore += 5; // 1 hour
  else if (avgResponseTime <= 120) responseScore += 3; // 2 hours
  scores.responseMetrics = responseScore;

  // Retention score (0-10 points)
  const retentionRate = analytics.clients?.retentionRate || 0;
  if (retentionRate >= 70) scores.retention = 10;
  else if (retentionRate >= 60) scores.retention = 8;
  else if (retentionRate >= 50) scores.retention = 6;
  else if (retentionRate >= 40) scores.retention = 4;
  else if (retentionRate >= 30) scores.retention = 2;

  // Loyalty tier score (0-10 points) - from LoyaltyProgram
  // This will be passed in from the controller
  // Bronze = 0, Silver = 3, Gold = 6, Platinum = 10

  // Recency score (0-5 points)
  const lastActivity = analytics.lastUpdated || new Date();
  const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
  if (daysSinceActivity <= 7) scores.recency = 5;
  else if (daysSinceActivity <= 14) scores.recency = 4;
  else if (daysSinceActivity <= 30) scores.recency = 3;
  else if (daysSinceActivity <= 60) scores.recency = 1;

  return scores;
};

// Static method to get featured providers
featuredProviderSchema.statics.getFeaturedProviders = async function(options = {}) {
  const { category, limit = 10, includePromoted = true } = options;

  const query = { isFeatured: true };

  if (category) {
    query.category = category;
  }

  // Check for active manual featured or promoted
  const now = new Date();
  query.$or = [
    { manuallyFeatured: true, manualFeaturedUntil: { $gt: now } },
    { isPromoted: true, promotionEndDate: { $gt: now } },
    { featuredType: 'automatic' }
  ];

  const featured = await this.find(query)
    .populate({
      path: 'provider',
      populate: [
        { path: 'user', select: 'firstName lastName profileImage' },
        { path: 'services', select: 'name price description' }
      ]
    })
    .sort({ qualityScore: -1, rank: 1 })
    .limit(limit);

  return featured;
};

// Static method to recalculate all rankings
featuredProviderSchema.statics.recalculateRankings = async function(category = null) {
  const query = category ? { category } : {};

  const providers = await this.find(query).sort({ qualityScore: -1 });

  for (let i = 0; i < providers.length; i++) {
    providers[i].rank = i + 1;
    await providers[i].save();
  }

  return providers.length;
};

const FeaturedProvider = mongoose.model('FeaturedProvider', featuredProviderSchema);

module.exports = FeaturedProvider;
