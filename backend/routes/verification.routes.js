const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const verificationController = require('../controllers/verification.controller');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/verifications/', req.user.id);
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG) and PDF are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// @route   POST api/verification/upload
// @desc    Upload verification documents
// @access  Private
router.post(
  '/upload',
  auth,
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]),
  [
    check('documentType', 'Document type is required').isIn(['passport', 'drivers_license', 'national_id', 'residence_permit', 'other'])
  ],
  verificationController.uploadVerificationDocuments
);

// @route   GET api/verification/status
// @desc    Get user's verification status
// @access  Private
router.get('/status', auth, verificationController.getVerificationStatus);

// @route   GET api/verification/pending
// @desc    Get all pending verifications (Admin only)
// @access  Private (Admin)
router.get('/pending', auth, adminAuth, verificationController.getPendingVerifications);

// @route   GET api/verification/stats
// @desc    Get verification statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', auth, adminAuth, verificationController.getVerificationStats);

// @route   GET api/verification/:id
// @desc    Get verification by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', auth, adminAuth, verificationController.getVerificationById);

// @route   PUT api/verification/:id/review
// @desc    Review verification (Admin only)
// @access  Private (Admin)
router.put(
  '/:id/review',
  [
    auth,
    adminAuth,
    check('status', 'Status is required').isIn(['approved', 'rejected']),
    check('rejectionReason', 'Rejection reason is required when rejecting').optional()
  ],
  verificationController.reviewVerification
);

// @route   PUT api/verification/:id/under-review
// @desc    Mark verification as under review (Admin only)
// @access  Private (Admin)
router.put('/:id/under-review', auth, adminAuth, verificationController.markAsUnderReview);

// @route   DELETE api/verification/:id
// @desc    Delete verification document
// @access  Private
router.delete('/:id', auth, verificationController.deleteVerification);

module.exports = router;
