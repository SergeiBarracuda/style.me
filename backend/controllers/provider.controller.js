const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const Service = require('../models/Service');
const { validationResult } = require('express-validator');

// Create provider profile
exports.createProviderProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { profession, bio, location, workingHours, isHomeService } = req.body;

    // Check if provider profile already exists
    let providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (providerProfile) {
      return res.status(400).json({ message: 'Provider profile already exists' });
    }

    // Create new provider profile
    providerProfile = new ProviderProfile({
      user: req.user.id,
      profession,
      bio,
      location,
      workingHours,
      isHomeService
    });

    // Save provider profile
    await providerProfile.save();

    // Update user role to provider
    await User.findByIdAndUpdate(req.user.id, { role: 'provider' });

    res.status(201).json(providerProfile);
  } catch (err) {
    console.error('Error in createProviderProfile controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update provider profile
exports.updateProviderProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { profession, bio, location, workingHours, isHomeService } = req.body;

    // Build provider profile object
    const profileFields = {};
    if (profession) profileFields.profession = profession;
    if (bio) profileFields.bio = bio;
    if (location) profileFields.location = location;
    if (workingHours) profileFields.workingHours = workingHours;
    if (isHomeService !== undefined) profileFields.isHomeService = isHomeService;

    // Update provider profile
    const providerProfile = await ProviderProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true }
    );

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(providerProfile);
  } catch (err) {
    console.error('Error in updateProviderProfile controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider profile by user ID
exports.getProviderProfileByUserId = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.params.userId })
      .populate('user', ['firstName', 'lastName', 'email', 'profileImage'])
      .populate('services');

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(providerProfile);
  } catch (err) {
    console.error('Error in getProviderProfileByUserId controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current provider profile
exports.getCurrentProviderProfile = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id })
      .populate('user', ['firstName', 'lastName', 'email', 'profileImage'])
      .populate('services');

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(providerProfile);
  } catch (err) {
    console.error('Error in getCurrentProviderProfile controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add portfolio item
exports.addPortfolioItem = async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;

    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Add portfolio item
    providerProfile.portfolio.unshift({ title, description, imageUrl });
    await providerProfile.save();

    res.json(providerProfile.portfolio);
  } catch (err) {
    console.error('Error in addPortfolioItem controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove portfolio item
exports.removePortfolioItem = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Remove portfolio item
    providerProfile.portfolio = providerProfile.portfolio.filter(
      item => item._id.toString() !== req.params.itemId
    );
    await providerProfile.save();

    res.json(providerProfile.portfolio);
  } catch (err) {
    console.error('Error in removePortfolioItem controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update availability
exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Update availability
    providerProfile.availability = availability;
    await providerProfile.save();

    res.json(providerProfile.availability);
  } catch (err) {
    console.error('Error in updateAvailability controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider availability
exports.getProviderAvailability = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findById(req.params.id);
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(providerProfile.availability);
  } catch (err) {
    console.error('Error in getProviderAvailability controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload verification documents
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    // In a real app, handle file upload with multer
    const { documentUrls } = req.body;

    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Update verification documents
    providerProfile.verificationDocuments = documentUrls;
    await providerProfile.save();

    res.json({ message: 'Verification documents uploaded successfully' });
  } catch (err) {
    console.error('Error in uploadVerificationDocuments controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
