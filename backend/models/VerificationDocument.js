const mongoose = require('mongoose');

const verificationDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['passport', 'drivers_license', 'national_id', 'residence_permit', 'other'],
    required: true
  },
  documentNumber: {
    type: String,
    trim: true
  },
  // Front side of document
  frontImage: {
    type: String,
    required: true
  },
  // Back side of document (optional for some document types)
  backImage: {
    type: String
  },
  // Selfie with document for additional verification
  selfieImage: {
    type: String
  },
  // Document expiry date
  expiryDate: {
    type: Date
  },
  // Verification status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Additional notes from admin
  adminNotes: {
    type: String,
    trim: true
  },
  // Metadata
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  // Verification attempts
  verificationAttempts: {
    type: Number,
    default: 0
  },
  // Auto-verification flags
  faceMatch: {
    type: Boolean,
    default: null
  },
  documentQuality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent', null],
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
verificationDocumentSchema.index({ user: 1, status: 1 });
verificationDocumentSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if document is expired
verificationDocumentSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
});

// Method to check if document needs renewal
verificationDocumentSchema.methods.needsRenewal = function() {
  if (!this.expiryDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate < thirtyDaysFromNow;
};

const VerificationDocument = mongoose.model('VerificationDocument', verificationDocumentSchema);

module.exports = VerificationDocument;
