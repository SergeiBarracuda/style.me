const Booking = require('../models/Booking');
const Service = require('../models/Service');
const ProviderProfile = require('../models/ProviderProfile');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serviceId, dateTime, notes } = req.body;

    // Find service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Find provider
    const provider = await ProviderProfile.findById(service.provider);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Calculate commission (5% of service price)
    const commission = service.price * 0.05;

    // Create new booking
    const booking = new Booking({
      client: req.user.id,
      provider: provider._id,
      service: service._id,
      dateTime: new Date(dateTime),
      duration: service.duration,
      price: service.price,
      commission,
      notes
    });

    // Save booking
    await booking.save();

    // Create payment record
    const payment = new Payment({
      booking: booking._id,
      client: req.user.id,
      provider: provider._id,
      amount: service.price,
      commission,
      paymentMethod: 'card',
      status: 'pending'
    });

    // Save payment
    await payment.save();

    // Update booking with payment reference
    booking.paymentId = payment._id;
    await booking.save();

    res.status(201).json({
      booking,
      payment
    });
  } catch (err) {
    console.error('Error in createBooking controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'firstName lastName email profileImage')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'firstName lastName email profileImage'
        }
      })
      .populate('service');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (
      booking.client._id.toString() !== req.user.id &&
      !(await ProviderProfile.findOne({ user: req.user.id, _id: booking.provider._id }))
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Error in getBookingById controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get client bookings
exports.getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user.id })
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'firstName lastName profileImage'
        }
      })
      .populate('service')
      .sort({ dateTime: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error in getClientBookings controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider bookings
exports.getProviderBookings = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const bookings = await Booking.find({ provider: providerProfile._id })
      .populate('client', 'firstName lastName email profileImage')
      .populate('service')
      .sort({ dateTime: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error in getProviderBookings controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Find booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to update this booking
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile || booking.provider.toString() !== providerProfile._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error('Error in updateBookingStatus controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    // Find booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Check if user is authorized to cancel this booking
    const isClient = booking.client.toString() === req.user.id;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    const isProvider = providerProfile && booking.provider.toString() === providerProfile._id.toString();

    if (!isClient && !isProvider) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = isClient ? 'client' : 'provider';
    await booking.save();

    // If payment was made, initiate refund
    if (booking.paymentStatus === 'paid') {
      const payment = await Payment.findById(booking.paymentId);
      if (payment) {
        payment.status = 'refunded';
        payment.refundReason = cancellationReason;
        payment.refundedAt = Date.now();
        await payment.save();
      }
    }

    res.json(booking);
  } catch (err) {
    console.error('Error in cancelBooking controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reschedule booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { dateTime } = req.body;

    // Find booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking cannot be rescheduled' });
    }

    // Check if user is authorized to reschedule this booking
    if (booking.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update booking
    booking.dateTime = new Date(dateTime);
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error('Error in rescheduleBooking controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
