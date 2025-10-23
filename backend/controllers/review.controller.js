const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create review
exports.createReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, rating, comment } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot review incomplete booking' });
    }

    // Check if user is authorized to review this booking
    if (booking.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if booking is already reviewed
    if (booking.isReviewed) {
      return res.status(400).json({ message: 'Booking already reviewed' });
    }

    // Find provider user ID
    const providerProfile = await ProviderProfile.findById(booking.provider);
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Create new review
    const review = new Review({
      booking: booking._id,
      reviewer: req.user.id,
      reviewee: providerProfile.user,
      rating,
      comment
    });

    // Save review
    await review.save();

    // Update booking
    booking.isReviewed = true;
    await booking.save();

    // Update provider rating
    const providerReviews = await Review.find({ reviewee: providerProfile.user });
    const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / providerReviews.length;

    providerProfile.rating = averageRating;
    providerProfile.reviewCount = providerReviews.length;
    await providerProfile.save();

    res.status(201).json(review);
  } catch (err) {
    console.error('Error in createReview controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews by provider
exports.getReviewsByProvider = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findById(req.params.providerId);
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const reviews = await Review.find({ reviewee: providerProfile.user, isPublic: true })
      .populate('reviewer', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Error in getReviewsByProvider controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews by client
exports.getReviewsByClient = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user.id })
      .populate({
        path: 'reviewee',
        select: 'firstName lastName profileImage'
      })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Error in getReviewsByClient controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews received by provider
exports.getReviewsReceivedByProvider = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const reviews = await Review.find({ reviewee: req.user.id })
      .populate('reviewer', 'firstName lastName profileImage')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Error in getReviewsReceivedByProvider controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Find review
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is authorized to update this review
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update review
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    await review.save();

    // Update provider rating
    const providerProfile = await ProviderProfile.findOne({ user: review.reviewee });
    if (providerProfile) {
      const providerReviews = await Review.find({ reviewee: review.reviewee });
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / providerReviews.length;

      providerProfile.rating = averageRating;
      await providerProfile.save();
    }

    res.json(review);
  } catch (err) {
    console.error('Error in updateReview controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    // Find review
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is authorized to delete this review
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update booking
    const booking = await Booking.findById(review.booking);
    if (booking) {
      booking.isReviewed = false;
      await booking.save();
    }

    // Delete review
    await Review.findByIdAndDelete(req.params.id);

    // Update provider rating
    const providerProfile = await ProviderProfile.findOne({ user: review.reviewee });
    if (providerProfile) {
      const providerReviews = await Review.find({ reviewee: review.reviewee });
      
      if (providerReviews.length === 0) {
        providerProfile.rating = 0;
        providerProfile.reviewCount = 0;
      } else {
        const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / providerReviews.length;

        providerProfile.rating = averageRating;
        providerProfile.reviewCount = providerReviews.length;
      }
      
      await providerProfile.save();
    }

    res.json({ message: 'Review removed' });
  } catch (err) {
    console.error('Error in deleteReview controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
