const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const { validationResult } = require('express-validator');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in getUserProfile controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, profileImage } = req.body;

    // Build user object
    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (phone) userFields.phone = phone;
    if (profileImage) userFields.profileImage = profileImage;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Error in updateUserProfile controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in getUserById controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add provider to favorites
exports.addToFavorites = async (req, res) => {
  try {
    const { providerId } = req.body;

    // Check if provider exists
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if already in favorites
    const user = await User.findById(req.user.id);
    if (user.favorites.includes(providerId)) {
      return res.status(400).json({ message: 'Provider already in favorites' });
    }

    // Add to favorites
    user.favorites.push(providerId);
    await user.save();

    res.json(user.favorites);
  } catch (err) {
    console.error('Error in addToFavorites controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove provider from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Update favorites
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: providerId } },
      { new: true }
    );

    res.json(user.favorites);
  } catch (err) {
    console.error('Error in removeFromFavorites controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user favorites
exports.getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      select: 'firstName lastName profileImage'
    });

    res.json(user.favorites);
  } catch (err) {
    console.error('Error in getUserFavorites controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user preferences
exports.updateUserPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    // Update preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences } },
      { new: true }
    );

    res.json(user.preferences);
  } catch (err) {
    console.error('Error in updateUserPreferences controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload verification document
exports.uploadVerification = async (req, res) => {
  try {
    // In a real app, handle file upload with multer
    const { documentUrl } = req.body;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { verificationToken: documentUrl } },
      { new: true }
    );

    res.json({ message: 'Verification document uploaded successfully' });
  } catch (err) {
    console.error('Error in uploadVerification controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
