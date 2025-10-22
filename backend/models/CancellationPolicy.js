const mongoose = require('mongoose');

const cancellationPolicySchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true
  },
  // Policy details
  name: {
    type: String,
    required: true,
    default: 'Standard Cancellation Policy'
  },
  description: {
    type: String,
    maxlength: 500
  },
  // Time-based cancellation rules
  cancellationRules: [{
    timeBeforeAppointment: {
      type: Number, // Hours before appointment
      required: true
    },
    penaltyType: {
      type: String,
      enum: ['none', 'percentage', 'fixed_amount', 'full_charge'],
      required: true
    },
    penaltyAmount: {
      type: Number, // Percentage (0-100) or fixed amount
      default: 0
    },
    refundPercentage: {
      type: Number, // Percentage of refund (0-100)
      default: 100,
      min: 0,
      max: 100
    }
  }],
  // No-show policy
  noShowPolicy: {
    enabled: {
      type: Boolean,
      default: true
    },
    penaltyType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'full_charge'],
      default: 'full_charge'
    },
    penaltyAmount: {
      type: Number,
      default: 100
    },
    gracePeriod: {
      type: Number, // Minutes after scheduled time before considered no-show
      default: 15
    }
  },
  // Late cancellation settings
  lateCancellation: {
    threshold: {
      type: Number, // Hours before appointment
      default: 24
    },
    penaltyType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      default: 'percentage'
    },
    penaltyAmount: {
      type: Number,
      default: 50
    }
  },
  // Rescheduling policy
  reschedulingPolicy: {
    allowed: {
      type: Boolean,
      default: true
    },
    maxReschedules: {
      type: Number,
      default: 2
    },
    minimumNotice: {
      type: Number, // Hours before appointment
      default: 24
    },
    feeType: {
      type: String,
      enum: ['none', 'fixed_amount'],
      default: 'none'
    },
    feeAmount: {
      type: Number,
      default: 0
    }
  },
  // Free cancellation window
  freeCancellationWindow: {
    enabled: {
      type: Boolean,
      default: true
    },
    hours: {
      type: Number, // Hours before appointment
      default: 48
    }
  },
  // Exceptions and special cases
  exceptions: [{
    reason: {
      type: String,
      enum: ['emergency', 'illness', 'weather', 'provider_cancellation', 'other']
    },
    refundPercentage: {
      type: Number,
      default: 100
    },
    requiresProof: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  // Repeat offender policy
  repeatOffenderPolicy: {
    enabled: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number, // Number of cancellations in timeframe
      default: 3
    },
    timeframe: {
      type: Number, // Days
      default: 90
    },
    penalty: {
      type: String,
      enum: ['warning', 'deposit_required', 'booking_restriction', 'account_suspension'],
      default: 'deposit_required'
    }
  },
  // Deposit requirements
  depositPolicy: {
    required: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'percentage'
    },
    refundable: {
      type: Boolean,
      default: true
    }
  },
  // Default/template policy
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Service-specific policies
  appliesTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // Policy metadata
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
cancellationPolicySchema.index({ provider: 1, isActive: 1 });
cancellationPolicySchema.index({ isDefault: 1 });

// Method to calculate cancellation penalty
cancellationPolicySchema.methods.calculatePenalty = function(booking, cancellationTime) {
  const scheduledTime = new Date(booking.scheduledDate);
  const hoursUntilAppointment = (scheduledTime - cancellationTime) / (1000 * 60 * 60);

  // Check for free cancellation window
  if (this.freeCancellationWindow.enabled && hoursUntilAppointment >= this.freeCancellationWindow.hours) {
    return {
      penalty: 0,
      refund: booking.price,
      refundPercentage: 100,
      reason: 'Free cancellation window'
    };
  }

  // Find applicable rule
  let applicableRule = null;
  for (const rule of this.cancellationRules.sort((a, b) => a.timeBeforeAppointment - b.timeBeforeAppointment)) {
    if (hoursUntilAppointment >= rule.timeBeforeAppointment) {
      applicableRule = rule;
    } else {
      break;
    }
  }

  if (!applicableRule) {
    // Use late cancellation if no rule applies
    return this.calculateLateCancellationPenalty(booking.price);
  }

  return this.calculatePenaltyFromRule(applicableRule, booking.price);
};

// Method to calculate penalty from rule
cancellationPolicySchema.methods.calculatePenaltyFromRule = function(rule, bookingPrice) {
  let penalty = 0;
  let refundPercentage = rule.refundPercentage;

  switch (rule.penaltyType) {
    case 'none':
      penalty = 0;
      refundPercentage = 100;
      break;
    case 'percentage':
      penalty = (bookingPrice * rule.penaltyAmount) / 100;
      break;
    case 'fixed_amount':
      penalty = Math.min(rule.penaltyAmount, bookingPrice);
      break;
    case 'full_charge':
      penalty = bookingPrice;
      refundPercentage = 0;
      break;
  }

  const refund = bookingPrice - penalty;

  return {
    penalty,
    refund: Math.max(0, refund),
    refundPercentage,
    reason: 'Standard cancellation policy'
  };
};

// Method to calculate late cancellation penalty
cancellationPolicySchema.methods.calculateLateCancellationPenalty = function(bookingPrice) {
  let penalty = 0;

  switch (this.lateCancellation.penaltyType) {
    case 'percentage':
      penalty = (bookingPrice * this.lateCancellation.penaltyAmount) / 100;
      break;
    case 'fixed_amount':
      penalty = Math.min(this.lateCancellation.penaltyAmount, bookingPrice);
      break;
  }

  const refund = bookingPrice - penalty;
  const refundPercentage = (refund / bookingPrice) * 100;

  return {
    penalty,
    refund: Math.max(0, refund),
    refundPercentage,
    reason: 'Late cancellation'
  };
};

// Method to calculate no-show penalty
cancellationPolicySchema.methods.calculateNoShowPenalty = function(bookingPrice) {
  if (!this.noShowPolicy.enabled) {
    return {
      penalty: 0,
      refund: bookingPrice,
      refundPercentage: 100,
      reason: 'No-show policy not enabled'
    };
  }

  let penalty = 0;

  switch (this.noShowPolicy.penaltyType) {
    case 'percentage':
      penalty = (bookingPrice * this.noShowPolicy.penaltyAmount) / 100;
      break;
    case 'fixed_amount':
      penalty = Math.min(this.noShowPolicy.penaltyAmount, bookingPrice);
      break;
    case 'full_charge':
      penalty = bookingPrice;
      break;
  }

  const refund = bookingPrice - penalty;
  const refundPercentage = (refund / bookingPrice) * 100;

  return {
    penalty,
    refund: Math.max(0, refund),
    refundPercentage,
    reason: 'No-show'
  };
};

// Method to check if rescheduling is allowed
cancellationPolicySchema.methods.canReschedule = function(booking, rescheduleCount) {
  if (!this.reschedulingPolicy.allowed) {
    return {
      allowed: false,
      reason: 'Rescheduling not allowed by provider'
    };
  }

  if (rescheduleCount >= this.reschedulingPolicy.maxReschedules) {
    return {
      allowed: false,
      reason: `Maximum reschedules (${this.reschedulingPolicy.maxReschedules}) exceeded`
    };
  }

  const scheduledTime = new Date(booking.scheduledDate);
  const hoursUntil = (scheduledTime - new Date()) / (1000 * 60 * 60);

  if (hoursUntil < this.reschedulingPolicy.minimumNotice) {
    return {
      allowed: false,
      reason: `Minimum notice of ${this.reschedulingPolicy.minimumNotice} hours required`
    };
  }

  return {
    allowed: true,
    fee: this.reschedulingPolicy.feeAmount,
    feeType: this.reschedulingPolicy.feeType
  };
};

// Method to check exception applicability
cancellationPolicySchema.methods.applyException = function(exceptionReason, bookingPrice) {
  const exception = this.exceptions.find(e => e.reason === exceptionReason);

  if (!exception) {
    return null;
  }

  const refundPercentage = exception.refundPercentage;
  const refund = (bookingPrice * refundPercentage) / 100;
  const penalty = bookingPrice - refund;

  return {
    penalty,
    refund,
    refundPercentage,
    reason: `Exception: ${exceptionReason}`,
    requiresProof: exception.requiresProof,
    notes: exception.notes
  };
};

// Static method to get default policy template
cancellationPolicySchema.statics.getDefaultTemplate = function() {
  return {
    name: 'Standard Cancellation Policy',
    description: 'Standard cancellation policy with 48-hour free cancellation window',
    cancellationRules: [
      {
        timeBeforeAppointment: 48,
        penaltyType: 'none',
        penaltyAmount: 0,
        refundPercentage: 100
      },
      {
        timeBeforeAppointment: 24,
        penaltyType: 'percentage',
        penaltyAmount: 25,
        refundPercentage: 75
      },
      {
        timeBeforeAppointment: 12,
        penaltyType: 'percentage',
        penaltyAmount: 50,
        refundPercentage: 50
      }
    ],
    noShowPolicy: {
      enabled: true,
      penaltyType: 'full_charge',
      penaltyAmount: 100,
      gracePeriod: 15
    },
    lateCancellation: {
      threshold: 24,
      penaltyType: 'percentage',
      penaltyAmount: 50
    },
    reschedulingPolicy: {
      allowed: true,
      maxReschedules: 2,
      minimumNotice: 24,
      feeType: 'none',
      feeAmount: 0
    },
    freeCancellationWindow: {
      enabled: true,
      hours: 48
    },
    exceptions: [
      {
        reason: 'emergency',
        refundPercentage: 100,
        requiresProof: true,
        notes: 'Medical or family emergency with documentation'
      },
      {
        reason: 'provider_cancellation',
        refundPercentage: 100,
        requiresProof: false,
        notes: 'Provider-initiated cancellation - full refund'
      }
    ]
  };
};

const CancellationPolicy = mongoose.model('CancellationPolicy', cancellationPolicySchema);

module.exports = CancellationPolicy;
