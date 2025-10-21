const VerificationDocument = require('../models/VerificationDocument');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload verification documents
 */
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentType, documentNumber, expiryDate } = req.body;

    // Check if files were uploaded
    if (!req.files || !req.files.frontImage) {
      return res.status(400).json({ message: 'Front image of document is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a pending or approved verification
    const existingVerification = await VerificationDocument.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'under_review', 'approved'] }
    });

    if (existingVerification && existingVerification.status === 'approved') {
      return res.status(400).json({
        message: 'You are already verified',
        verificationId: existingVerification._id
      });
    }

    if (existingVerification && existingVerification.status !== 'rejected') {
      return res.status(400).json({
        message: 'You already have a verification request in progress',
        verificationId: existingVerification._id,
        status: existingVerification.status
      });
    }

    // Create file paths
    const frontImagePath = `/uploads/verifications/${req.user.id}/${Date.now()}_front${path.extname(req.files.frontImage[0].originalname)}`;
    const backImagePath = req.files.backImage ? `/uploads/verifications/${req.user.id}/${Date.now()}_back${path.extname(req.files.backImage[0].originalname)}` : null;
    const selfieImagePath = req.files.selfieImage ? `/uploads/verifications/${req.user.id}/${Date.now()}_selfie${path.extname(req.files.selfieImage[0].originalname)}` : null;

    // Create verification document
    const verificationDoc = new VerificationDocument({
      user: req.user.id,
      documentType,
      documentNumber,
      frontImage: frontImagePath,
      backImage: backImagePath,
      selfieImage: selfieImagePath,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      verificationAttempts: existingVerification ? existingVerification.verificationAttempts + 1 : 1
    });

    await verificationDoc.save();

    // Update user verification status
    user.idVerificationStatus = 'pending';
    user.idVerificationSubmittedAt = new Date();
    await user.save();

    // Return response without sensitive data
    res.status(201).json({
      message: 'Verification documents uploaded successfully',
      verification: {
        id: verificationDoc._id,
        documentType: verificationDoc.documentType,
        status: verificationDoc.status,
        uploadedAt: verificationDoc.uploadedAt
      }
    });
  } catch (err) {
    console.error('Error uploading verification documents:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's verification status
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('idVerificationStatus idVerificationSubmittedAt idVerificationApprovedAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verification = await VerificationDocument.findOne({
      user: req.user.id
    }).sort({ createdAt: -1 }).select('-adminNotes -ipAddress -userAgent');

    res.json({
      status: user.idVerificationStatus,
      submittedAt: user.idVerificationSubmittedAt,
      approvedAt: user.idVerificationApprovedAt,
      verification: verification ? {
        id: verification._id,
        documentType: verification.documentType,
        status: verification.status,
        uploadedAt: verification.uploadedAt,
        reviewedAt: verification.reviewedAt,
        rejectionReason: verification.rejectionReason,
        expiryDate: verification.expiryDate,
        needsRenewal: verification.needsRenewal()
      } : null
    });
  } catch (err) {
    console.error('Error getting verification status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all pending verifications (Admin only)
 */
exports.getPendingVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const verifications = await VerificationDocument.find({
      status: { $in: ['pending', 'under_review'] }
    })
      .populate('user', 'firstName lastName email role profileImage')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await VerificationDocument.countDocuments({
      status: { $in: ['pending', 'under_review'] }
    });

    res.json({
      verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error getting pending verifications:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get verification by ID (Admin only)
 */
exports.getVerificationById = async (req, res) => {
  try {
    const verification = await VerificationDocument.findById(req.params.id)
      .populate('user', 'firstName lastName email phone role profileImage createdAt')
      .populate('reviewedBy', 'firstName lastName email');

    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    res.json(verification);
  } catch (err) {
    console.error('Error getting verification:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Review verification (Admin only)
 */
exports.reviewVerification = async (req, res) => {
  try {
    const { status, rejectionReason, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required when rejecting' });
    }

    const verification = await VerificationDocument.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    // Update verification status
    verification.status = status;
    verification.reviewedBy = req.user.id;
    verification.reviewedAt = new Date();
    verification.rejectionReason = status === 'rejected' ? rejectionReason : null;
    verification.adminNotes = adminNotes;

    await verification.save();

    // Update user verification status
    const user = await User.findById(verification.user);
    if (user) {
      user.idVerificationStatus = status;
      if (status === 'approved') {
        user.idVerificationApprovedAt = new Date();
        user.isVerified = true;
      }
      await user.save();
    }

    res.json({
      message: `Verification ${status}`,
      verification: {
        id: verification._id,
        status: verification.status,
        reviewedAt: verification.reviewedAt
      }
    });
  } catch (err) {
    console.error('Error reviewing verification:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update verification status to under_review (Admin only)
 */
exports.markAsUnderReview = async (req, res) => {
  try {
    const verification = await VerificationDocument.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending verifications can be marked as under review' });
    }

    verification.status = 'under_review';
    await verification.save();

    // Update user status
    await User.findByIdAndUpdate(verification.user, {
      idVerificationStatus: 'under_review'
    });

    res.json({
      message: 'Verification marked as under review',
      verification: {
        id: verification._id,
        status: verification.status
      }
    });
  } catch (err) {
    console.error('Error marking verification as under review:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get verification statistics (Admin only)
 */
exports.getVerificationStats = async (req, res) => {
  try {
    const stats = await VerificationDocument.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await VerificationDocument.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get expiring documents (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCount = await VerificationDocument.countDocuments({
      status: 'approved',
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });

    res.json({
      overall: stats,
      today: todayStats,
      expiring: expiringCount
    });
  } catch (err) {
    console.error('Error getting verification stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete verification document (User can delete rejected submissions)
 */
exports.deleteVerification = async (req, res) => {
  try {
    const verification = await VerificationDocument.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    // Check authorization
    if (verification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow deletion of rejected verifications for users
    if (req.user.role !== 'admin' && verification.status !== 'rejected') {
      return res.status(403).json({ message: 'Can only delete rejected verifications' });
    }

    // Delete files (implement file deletion logic here)
    // await deleteVerificationFiles(verification);

    await VerificationDocument.findByIdAndDelete(req.params.id);

    res.json({ message: 'Verification deleted successfully' });
  } catch (err) {
    console.error('Error deleting verification:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
