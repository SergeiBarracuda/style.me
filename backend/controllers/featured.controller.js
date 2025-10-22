const FeaturedProvider = require('../models/FeaturedProvider');
const ProviderProfile = require('../models/ProviderProfile');
const ProviderAnalytics = require('../models/ProviderAnalytics');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const Dispute = require('../models/Dispute');
const { validationResult } = require('express-validator');

// @desc    Get featured providers
// @route   GET /api/featured
// @access  Public
exports.getFeaturedProviders = async (req, res) => {
  try {
    const { category, limit = 10, location, service } = req.query;

    const options = {
      category,
      limit: parseInt(limit)
    };

    let featured = await FeaturedProvider.getFeaturedProviders(options);

    // Filter by location if provided
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        featured = featured.filter(fp => {
          if (!fp.provider.serviceArea || !fp.provider.serviceArea.coordinates) return false;

          const providerLat = fp.provider.serviceArea.coordinates[1];
          const providerLng = fp.provider.serviceArea.coordinates[0];

          // Simple distance calculation (can be improved with actual distance formula)
          const distance = Math.sqrt(
            Math.pow(lat - providerLat, 2) + Math.pow(lng - providerLng, 2)
          );

          return distance <= (fp.provider.serviceRadius || 25) / 111; // Rough km to degree conversion
        });
      }
    }

    // Track impressions
    for (const fp of featured) {
      fp.trackImpression();
      await fp.save();
    }

    res.json({
      count: featured.length,
      featured
    });
  } catch (error) {
    console.error('Error fetching featured providers:', error);
    res.status(500).json({ message: 'Error fetching featured providers', error: error.message });
  }
};

// @desc    Get provider's featured status and score details
// @route   GET /api/featured/my-status
// @access  Private/Provider
exports.getProviderFeaturedStatus = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    let featuredProvider = await FeaturedProvider.findOne({ provider: providerProfile._id });

    if (!featuredProvider) {
      return res.json({
        isFeatured: false,
        message: 'Not yet eligible for featured status. Complete more bookings and maintain high ratings to qualify.'
      });
    }

    // Get recommendations for improvement
    const recommendations = [];

    if (featuredProvider.scores.rating < 20) {
      recommendations.push('Improve your average rating to 4.5+ stars');
    }
    if (featuredProvider.scores.completionRate < 17) {
      recommendations.push('Increase your booking completion rate to 90%+');
    }
    if (featuredProvider.scores.responseMetrics < 12) {
      recommendations.push('Respond to inquiries faster and more consistently');
    }
    if (featuredProvider.scores.retention < 8) {
      recommendations.push('Focus on client retention and building repeat customers');
    }

    res.json({
      isFeatured: featuredProvider.isFeatured,
      featuredType: featuredProvider.featuredType,
      qualityScore: featuredProvider.qualityScore,
      rank: featuredProvider.rank,
      scores: featuredProvider.scores,
      featuredBadge: featuredProvider.featuredBadge,
      featuredSince: featuredProvider.featuredSince,
      recommendations: recommendations.length > 0 ? recommendations : ['Keep up the great work!'],
      performance: {
        impressions: featuredProvider.impressions,
        clicks: featuredProvider.clicks,
        bookingsFromFeatured: featuredProvider.bookingsFromFeatured,
        clickThroughRate: featuredProvider.clickThroughRate.toFixed(2) + '%',
        conversionRate: featuredProvider.conversionRate.toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('Error fetching provider featured status:', error);
    res.status(500).json({ message: 'Error fetching featured status', error: error.message });
  }
};

// @desc    Update provider's featured scores
// @route   POST /api/featured/update-scores/:providerId
// @access  Private/Admin or System
exports.updateProviderScores = async (req, res) => {
  try {
    const { providerId } = req.params;

    const providerProfile = await ProviderProfile.findById(providerId);

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get analytics
    const analytics = await ProviderAnalytics.findOne({ provider: providerId });

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found. Provider needs to complete bookings first.' });
    }

    // Get loyalty tier score
    const loyaltyProgram = await LoyaltyProgram.findOne({ user: providerProfile.user });
    let loyaltyScore = 0;
    if (loyaltyProgram) {
      const tierScores = { bronze: 0, silver: 3, gold: 6, platinum: 10 };
      loyaltyScore = tierScores[loyaltyProgram.tier] || 0;
    }

    // Calculate scores
    const scores = await FeaturedProvider.calculateProviderScores(providerId, analytics);
    scores.loyaltyTier = loyaltyScore;

    // Get or create featured provider record
    let featuredProvider = await FeaturedProvider.findOne({ provider: providerId });

    if (!featuredProvider) {
      featuredProvider = new FeaturedProvider({
        provider: providerId,
        category: providerProfile.category || 'other'
      });
    }

    // Update scores
    featuredProvider.scores = scores;
    featuredProvider.calculateQualityScore();
    featuredProvider.updateFeaturedStatus();
    featuredProvider.determineBadge();
    featuredProvider.lastScoreUpdate = new Date();

    await featuredProvider.save();

    // Recalculate rankings for this category
    await FeaturedProvider.recalculateRankings(featuredProvider.category);

    res.json({
      message: 'Provider scores updated successfully',
      featuredProvider
    });
  } catch (error) {
    console.error('Error updating provider scores:', error);
    res.status(500).json({ message: 'Error updating scores', error: error.message });
  }
};

// @desc    Manually feature a provider (Admin)
// @route   POST /api/featured/manual-feature
// @access  Private/Admin
exports.manuallyFeatureProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { providerId, duration, notes } = req.body;
    const adminId = req.user.id;

    const providerProfile = await ProviderProfile.findById(providerId);

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    let featuredProvider = await FeaturedProvider.findOne({ provider: providerId });

    if (!featuredProvider) {
      featuredProvider = new FeaturedProvider({
        provider: providerId,
        category: providerProfile.category || 'other'
      });
    }

    // Set manual featured status
    featuredProvider.manuallyFeatured = true;
    featuredProvider.featuredType = 'manual';
    featuredProvider.featuredBy = adminId;
    featuredProvider.notes = notes || '';

    // Set expiration (duration in days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (duration || 30));
    featuredProvider.manualFeaturedUntil = expirationDate;

    // Update featured status
    featuredProvider.calculateQualityScore();
    featuredProvider.updateFeaturedStatus();

    if (!featuredProvider.featuredSince) {
      featuredProvider.featuredSince = new Date();
    }

    await featuredProvider.save();

    res.json({
      message: 'Provider manually featured successfully',
      featuredProvider,
      expiresAt: expirationDate
    });
  } catch (error) {
    console.error('Error manually featuring provider:', error);
    res.status(500).json({ message: 'Error featuring provider', error: error.message });
  }
};

// @desc    Promote a provider (Paid promotion)
// @route   POST /api/featured/promote
// @access  Private/Admin
exports.promoteProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { providerId, duration, priority, startDate } = req.body;

    const providerProfile = await ProviderProfile.findById(providerId);

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    let featuredProvider = await FeaturedProvider.findOne({ provider: providerId });

    if (!featuredProvider) {
      featuredProvider = new FeaturedProvider({
        provider: providerId,
        category: providerProfile.category || 'other'
      });
    }

    // Set promoted status
    featuredProvider.isPromoted = true;
    featuredProvider.featuredType = 'promoted';
    featuredProvider.promotionPriority = priority || 5;

    // Set promotion period
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (duration || 7));

    featuredProvider.promotionStartDate = start;
    featuredProvider.promotionEndDate = end;

    // Update featured status
    featuredProvider.calculateQualityScore();
    featuredProvider.updateFeaturedStatus();

    if (!featuredProvider.featuredSince) {
      featuredProvider.featuredSince = new Date();
    }

    await featuredProvider.save();

    res.json({
      message: 'Provider promoted successfully',
      featuredProvider,
      promotionPeriod: {
        start,
        end
      }
    });
  } catch (error) {
    console.error('Error promoting provider:', error);
    res.status(500).json({ message: 'Error promoting provider', error: error.message });
  }
};

// @desc    Remove featured status (Admin)
// @route   DELETE /api/featured/:providerId
// @access  Private/Admin
exports.removeFeaturedStatus = async (req, res) => {
  try {
    const { providerId } = req.params;

    const featuredProvider = await FeaturedProvider.findOne({ provider: providerId });

    if (!featuredProvider) {
      return res.status(404).json({ message: 'Featured provider record not found' });
    }

    featuredProvider.isFeatured = false;
    featuredProvider.manuallyFeatured = false;
    featuredProvider.isPromoted = false;
    featuredProvider.featuredSince = null;
    featuredProvider.featuredType = 'automatic';

    await featuredProvider.save();

    res.json({
      message: 'Featured status removed successfully',
      featuredProvider
    });
  } catch (error) {
    console.error('Error removing featured status:', error);
    res.status(500).json({ message: 'Error removing featured status', error: error.message });
  }
};

// @desc    Track provider click
// @route   POST /api/featured/:providerId/click
// @access  Public
exports.trackClick = async (req, res) => {
  try {
    const { providerId } = req.params;

    const featuredProvider = await FeaturedProvider.findOne({ provider: providerId });

    if (featuredProvider) {
      featuredProvider.trackClick();
      await featuredProvider.save();
    }

    res.json({ message: 'Click tracked' });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Error tracking click', error: error.message });
  }
};

// @desc    Track booking from featured
// @route   POST /api/featured/:providerId/booking
// @access  Private
exports.trackBooking = async (req, res) => {
  try {
    const { providerId } = req.params;

    const featuredProvider = await FeaturedProvider.findOne({ provider: providerId });

    if (featuredProvider) {
      featuredProvider.trackBooking();
      await featuredProvider.save();
    }

    res.json({ message: 'Booking tracked' });
  } catch (error) {
    console.error('Error tracking booking:', error);
    res.status(500).json({ message: 'Error tracking booking', error: error.message });
  }
};

// @desc    Get featured provider rankings
// @route   GET /api/featured/rankings
// @access  Private/Admin
exports.getRankings = async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }

    const rankings = await FeaturedProvider.find(query)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ qualityScore: -1, rank: 1 })
      .limit(parseInt(limit));

    res.json({
      count: rankings.length,
      rankings
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ message: 'Error fetching rankings', error: error.message });
  }
};

// @desc    Bulk update all provider scores (Admin/System)
// @route   POST /api/featured/bulk-update
// @access  Private/Admin
exports.bulkUpdateScores = async (req, res) => {
  try {
    const providers = await ProviderProfile.find({ isActive: true });

    let updated = 0;
    let failed = 0;

    for (const provider of providers) {
      try {
        const analytics = await ProviderAnalytics.findOne({ provider: provider._id });

        if (!analytics || analytics.bookings.completed < 5) {
          continue; // Skip providers with insufficient data
        }

        const loyaltyProgram = await LoyaltyProgram.findOne({ user: provider.user });
        let loyaltyScore = 0;
        if (loyaltyProgram) {
          const tierScores = { bronze: 0, silver: 3, gold: 6, platinum: 10 };
          loyaltyScore = tierScores[loyaltyProgram.tier] || 0;
        }

        const scores = await FeaturedProvider.calculateProviderScores(provider._id, analytics);
        scores.loyaltyTier = loyaltyScore;

        let featuredProvider = await FeaturedProvider.findOne({ provider: provider._id });

        if (!featuredProvider) {
          featuredProvider = new FeaturedProvider({
            provider: provider._id,
            category: provider.category || 'other'
          });
        }

        featuredProvider.scores = scores;
        featuredProvider.calculateQualityScore();
        featuredProvider.updateFeaturedStatus();
        featuredProvider.determineBadge();
        featuredProvider.lastScoreUpdate = new Date();

        await featuredProvider.save();
        updated++;
      } catch (err) {
        console.error(`Error updating provider ${provider._id}:`, err);
        failed++;
      }
    }

    // Recalculate all rankings
    const categories = ['hair', 'nails', 'makeup', 'spa', 'massage', 'skincare', 'other'];
    for (const category of categories) {
      await FeaturedProvider.recalculateRankings(category);
    }

    res.json({
      message: 'Bulk update completed',
      updated,
      failed,
      total: providers.length
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Error in bulk update', error: error.message });
  }
};

module.exports = exports;
