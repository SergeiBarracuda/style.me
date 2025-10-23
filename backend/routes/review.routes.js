const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const auth = require('../middleware/auth');

// @route   POST api/reviews
// @desc    Create review
// @access  Private
router.post(
  '/',
  [
    auth,
    check('bookingId', 'Booking ID is required').not().isEmpty(),
    check('rating', 'Rating is required').isNumeric().isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').not().isEmpty()
  ],
  reviewController.createReview
);

// @route   GET api/reviews/provider/:providerId
// @desc    Get reviews by provider
// @access  Public
router.get('/provider/:providerId', reviewController.getReviewsByProvider);

// @route   GET api/reviews/client
// @desc    Get reviews by client
// @access  Private
router.get('/client', auth, reviewController.getReviewsByClient);

// @route   GET api/reviews/received
// @desc    Get reviews received by provider
// @access  Private
router.get('/received', auth, reviewController.getReviewsReceivedByProvider);

// @route   PUT api/reviews/:id
// @desc    Update review
// @access  Private
router.put(
  '/:id',
  [
    auth,
    check('rating', 'Rating must be between 1 and 5').optional().isNumeric().isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').optional().not().isEmpty()
  ],
  reviewController.updateReview
);

// @route   DELETE api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;
