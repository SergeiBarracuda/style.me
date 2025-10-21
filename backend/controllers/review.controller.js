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

    // Find provider user ID
    const providerProfile = await ProviderProfile.findById(booking.provider);
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Determine if user is client or provider
    const isClient = booking.client.toString() === req.user.id;
    const isProvider = providerProfile.user.toString() === req.user.id;

    // Check if user is authorized to review this booking
    if (!isClient && !isProvider) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if this user has already reviewed this booking
    const existingReview = await Review.findOne({
      booking: booking._id,
      reviewer: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this booking',
        reviewId: existingReview._id
      });
    }

    // Determine the reviewee based on who is reviewing
    const reviewee = isClient ? providerProfile.user : booking.client;

    // Create new review
    const review = new Review({
      booking: booking._id,
      reviewer: req.user.id,
      reviewee: reviewee,
      rating,
      comment
    });

    // Save review
    await review.save();

    // Check if both parties have reviewed
    const allReviews = await Review.find({ booking: booking._id });
    if (allReviews.length === 2) {
      // Both client and provider have reviewed
      booking.isReviewed = true;
      await booking.save();
    }

    // Update ratings
    if (isClient) {
      // Client is reviewing provider - update provider rating
      const providerReviews = await Review.find({ reviewee: providerProfile.user });
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / providerReviews.length;

      providerProfile.rating = averageRating;
      providerProfile.reviewCount = providerReviews.length;
      await providerProfile.save();
    } else {
      // Provider is reviewing client - update client rating if needed
      const clientUser = await User.findById(booking.client);
      if (clientUser) {
        const clientReviews = await Review.find({ reviewee: booking.client });
        const totalRating = clientReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = clientReviews.length > 0 ? totalRating / clientReviews.length : 0;

        // Add client rating to user model
        clientUser.clientRating = averageRating;
        clientUser.clientReviewCount = clientReviews.length;
        await clientUser.save();
      }
    }

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

// Get reviews received by client (providers rating clients)
exports.getReviewsReceivedByClient = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.user.id })
      .populate('reviewer', 'firstName lastName profileImage')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Error in getReviewsReceivedByClient controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get booking reviews status (check if both parties have reviewed)
exports.getBookingReviewStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized
    const providerProfile = await ProviderProfile.findById(booking.provider);
    const isClient = booking.client.toString() === req.user.id;
    const isProvider = providerProfile && providerProfile.user.toString() === req.user.id;

    if (!isClient && !isProvider) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get all reviews for this booking
    const reviews = await Review.find({ booking: booking._id })
      .populate('reviewer', 'firstName lastName profileImage role')
      .populate('reviewee', 'firstName lastName profileImage role');

    // Check if current user has reviewed
    const userHasReviewed = reviews.some(review =>
      review.reviewer._id.toString() === req.user.id
    );

    // Check if other party has reviewed
    const otherPartyHasReviewed = reviews.some(review =>
      review.reviewee._id.toString() === req.user.id
    );

    res.json({
      canReview: booking.status === 'completed' && !userHasReviewed,
      userHasReviewed,
      otherPartyHasReviewed,
      reviews,
      isFullyReviewed: reviews.length === 2
    });
  } catch (err) {
    console.error('Error in getBookingReviewStatus controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
