const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_service', 'reduced_commission'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  // Target users
  targetType: {
    type: String,
    enum: ['all', 'new_users', 'new_providers', 'specific_users', 'loyalty_tier'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum']
  },
  // Service restrictions
  applicableServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  applicableCategories: [{
    type: String
  }],
  // Usage limits
  maxUses: {
    type: Number
  },
  maxUsesPerUser: {
    type: Number,
    default: 1
  },
  currentUses: {
    type: Number,
    default: 0
  },
  // Min requirements
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  // Date constraints
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Method to check if promotion is valid
promotionSchema.methods.isValid = function(userId, amount) {
  const now = new Date();

  // Check if active
  if (!this.isActive) return { valid: false, reason: 'Promotion is not active' };

  // Check dates
  if (now < this.startDate) return { valid: false, reason: 'Promotion has not started yet' };
  if (now > this.endDate) return { valid: false, reason: 'Promotion has expired' };

  // Check usage limits
  if (this.maxUses && this.currentUses >= this.maxUses) {
    return { valid: false, reason: 'Promotion usage limit reached' };
  }

  // Check minimum purchase amount
  if (amount < this.minPurchaseAmount) {
    return { valid: false, reason: `Minimum purchase amount is $${this.minPurchaseAmount}` };
  }

  return { valid: true };
};

// Method to calculate discount
promotionSchema.methods.calculateDiscount = function(amount) {
  switch (this.type) {
    case 'percentage':
      return (amount * this.value) / 100;
    case 'fixed_amount':
      return Math.min(this.value, amount);
    case 'reduced_commission':
      return 0; // Handled separately in commission calculation
    default:
      return 0;
  }
};

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
