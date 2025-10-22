const mongoose = require('mongoose');

const gdprConsentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consentType: {
    type: String,
    enum: [
      'terms_of_service',
      'privacy_policy',
      'marketing_emails',
      'analytics_tracking',
      'location_tracking',
      'data_processing',
      'third_party_sharing'
    ],
    required: true
  },
  granted: {
    type: Boolean,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
gdprConsentSchema.index({ user: 1, consentType: 1, granted: 1 });

const GDPRConsent = mongoose.model('GDPRConsent', gdprConsentSchema);

module.exports = GDPRConsent;
