const Promotion = require('../models/Promotion');
const User = require('../models/User');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const { validationResult } = require('express-validator');

// @desc    Create a new promotion
// @route   POST /api/promotions
// @access  Private/Admin
exports.createPromotion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      name,
      description,
      type,
      value,
      targetType,
      targetUsers,
      targetTier,
      minAmount,
      maxDiscount,
      startDate,
      endDate,
      maxUses,
      maxUsesPerUser,
      isActive
    } = req.body;

    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromotion) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }

    const promotion = new Promotion({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      targetType,
      targetUsers,
      targetTier,
      minAmount,
      maxDiscount,
      startDate,
      endDate,
      maxUses,
      maxUsesPerUser,
      isActive
    });

    await promotion.save();

    res.status(201).json({
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ message: 'Error creating promotion', error: error.message });
  }
};

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private/Admin
exports.getAllPromotions = async (req, res) => {
  try {
    const { active, type, targetType } = req.query;

    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    if (type) {
      filter.type = type;
    }
    if (targetType) {
      filter.targetType = targetType;
    }

    const promotions = await Promotion.find(filter).sort({ createdAt: -1 });

    res.json({
      count: promotions.length,
      promotions
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ message: 'Error fetching promotions', error: error.message });
  }
};

// @desc    Get promotion by code
// @route   GET /api/promotions/code/:code
// @access  Public
exports.getPromotionByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found or inactive' });
    }

    res.json({ promotion });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ message: 'Error fetching promotion', error: error.message });
  }
};

// @desc    Validate promotion for user
// @route   POST /api/promotions/validate
// @access  Private
exports.validatePromotion = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'Promotion code is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promotion) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired promotion code'
      });
    }

    // Validate promotion
    const isValid = promotion.isValid(userId, amount);

    if (!isValid.valid) {
      return res.status(400).json({
        valid: false,
        message: isValid.message
      });
    }

    // Calculate discount
    const discount = promotion.calculateDiscount(amount);

    res.json({
      valid: true,
      promotion: {
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value
      },
      discount,
      finalAmount: amount - discount
    });
  } catch (error) {
    console.error('Error validating promotion:', error);
    res.status(500).json({
      valid: false,
      message: 'Error validating promotion',
      error: error.message
    });
  }
};

// @desc    Apply promotion (record usage)
// @route   POST /api/promotions/apply
// @access  Private
exports.applyPromotion = async (req, res) => {
  try {
    const { code, amount, bookingId } = req.body;
    const userId = req.user.id;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Invalid or expired promotion code' });
    }

    // Validate promotion
    const isValid = promotion.isValid(userId, amount);

    if (!isValid.valid) {
      return res.status(400).json({ message: isValid.message });
    }

    // Calculate discount
    const discount = promotion.calculateDiscount(amount);

    // Record usage
    promotion.usedCount += 1;
    promotion.usageHistory.push({
      user: userId,
      booking: bookingId,
      amount,
      discount,
      usedAt: new Date()
    });

    await promotion.save();

    res.json({
      message: 'Promotion applied successfully',
      discount,
      finalAmount: amount - discount
    });
  } catch (error) {
    console.error('Error applying promotion:', error);
    res.status(500).json({ message: 'Error applying promotion', error: error.message });
  }
};

// @desc    Get available promotions for user
// @route   GET /api/promotions/available
// @access  Private
exports.getAvailablePromotions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's loyalty tier if they have one
    let userTier = 'bronze';
    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });
    if (loyaltyProgram) {
      userTier = loyaltyProgram.tier;
    }

    const now = new Date();

    // Find promotions that are active and applicable to the user
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { targetType: 'all' },
        { targetType: 'new_users', targetUsers: userId },
        { targetType: 'specific_users', targetUsers: userId },
        { targetType: 'loyalty_tier', targetTier: userTier }
      ]
    }).select('-usageHistory');

    // Filter out promotions that have reached max uses
    const availablePromotions = promotions.filter(promo => {
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return false;
      }

      // Check per-user usage limit
      if (promo.maxUsesPerUser) {
        const userUsageCount = promo.usageHistory.filter(
          usage => usage.user.toString() === userId
        ).length;

        if (userUsageCount >= promo.maxUsesPerUser) {
          return false;
        }
      }

      return true;
    });

    res.json({
      count: availablePromotions.length,
      promotions: availablePromotions
    });
  } catch (error) {
    console.error('Error fetching available promotions:', error);
    res.status(500).json({ message: 'Error fetching available promotions', error: error.message });
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private/Admin
exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating usage history or used count
    delete updateData.usageHistory;
    delete updateData.usedCount;

    // If updating code, check for duplicates
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existingPromotion = await Promotion.findOne({
        code: updateData.code,
        _id: { $ne: id }
      });

      if (existingPromotion) {
        return res.status(400).json({ message: 'Promotion code already exists' });
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({
      message: 'Promotion updated successfully',
      promotion
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ message: 'Error updating promotion', error: error.message });
  }
};

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ message: 'Error deleting promotion', error: error.message });
  }
};

// @desc    Get promotion statistics
// @route   GET /api/promotions/:id/stats
// @access  Private/Admin
exports.getPromotionStats = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id).populate('usageHistory.user', 'name email');

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    const totalDiscount = promotion.usageHistory.reduce((sum, usage) => sum + usage.discount, 0);
    const totalRevenue = promotion.usageHistory.reduce((sum, usage) => sum + usage.amount, 0);
    const uniqueUsers = [...new Set(promotion.usageHistory.map(usage => usage.user._id.toString()))].length;

    const stats = {
      promotion: {
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value
      },
      usage: {
        totalUses: promotion.usedCount,
        maxUses: promotion.maxUses || 'Unlimited',
        remainingUses: promotion.maxUses ? promotion.maxUses - promotion.usedCount : 'Unlimited',
        uniqueUsers
      },
      financial: {
        totalDiscount,
        totalRevenue,
        averageDiscount: promotion.usedCount > 0 ? totalDiscount / promotion.usedCount : 0
      },
      timeline: {
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        daysRemaining: Math.max(0, Math.ceil((promotion.endDate - new Date()) / (1000 * 60 * 60 * 24)))
      },
      recentUsage: promotion.usageHistory.slice(-10).reverse()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching promotion stats:', error);
    res.status(500).json({ message: 'Error fetching promotion stats', error: error.message });
  }
};

module.exports = exports;
