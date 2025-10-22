const User = require('../models/User');
const GDPRConsent = require('../models/GDPRConsent');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Message = require('../models/Message');
const VerificationDocument = require('../models/VerificationDocument');
const ProviderProfile = require('../models/ProviderProfile');
const Service = require('../models/Service');

/**
 * Record user consent
 */
exports.recordConsent = async (req, res) => {
  try {
    const { consentType, granted, version } = req.body;

    if (!consentType || granted === undefined || !version) {
      return res.status(400).json({ message: 'Consent type, granted status, and version are required' });
    }

    // Check if consent already exists
    const existingConsent = await GDPRConsent.findOne({
      user: req.user.id,
      consentType,
      granted: true
    });

    if (existingConsent && granted) {
      // Update existing consent
      existingConsent.version = version;
      existingConsent.grantedAt = new Date();
      existingConsent.ipAddress = req.ip;
      existingConsent.userAgent = req.get('User-Agent');
      await existingConsent.save();

      return res.json({
        message: 'Consent updated',
        consent: existingConsent
      });
    }

    if (existingConsent && !granted) {
      // Revoke consent
      existingConsent.granted = false;
      existingConsent.revokedAt = new Date();
      await existingConsent.save();

      return res.json({
        message: 'Consent revoked',
        consent: existingConsent
      });
    }

    // Create new consent
    const consent = new GDPRConsent({
      user: req.user.id,
      consentType,
      granted,
      version,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await consent.save();

    res.status(201).json({
      message: 'Consent recorded',
      consent
    });
  } catch (err) {
    console.error('Error recording consent:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user consents
 */
exports.getUserConsents = async (req, res) => {
  try {
    const consents = await GDPRConsent.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(consents);
  } catch (err) {
    console.error('Error getting consents:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Export user data (GDPR Right to Data Portability)
 */
exports.exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Gather all user data
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    const services = await Service.find({ provider: providerProfile?._id });
    const bookings = await Booking.find({
      $or: [{ client: req.user.id }, { provider: providerProfile?._id }]
    });
    const reviews = await Review.find({
      $or: [{ reviewer: req.user.id }, { reviewee: req.user.id }]
    });
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    });
    const consents = await GDPRConsent.find({ user: req.user.id });
    const verificationDocs = await VerificationDocument.find({ user: req.user.id })
      .select('-frontImage -backImage -selfieImage'); // Exclude images for privacy

    const exportData = {
      exportDate: new Date().toISOString(),
      user: user.toObject(),
      providerProfile: providerProfile ? providerProfile.toObject() : null,
      services: services.map(s => s.toObject()),
      bookings: bookings.map(b => b.toObject()),
      reviews: reviews.map(r => r.toObject()),
      messages: messages.map(m => m.toObject()),
      consents: consents.map(c => c.toObject()),
      verificationStatus: verificationDocs.map(v => ({
        documentType: v.documentType,
        status: v.status,
        uploadedAt: v.uploadedAt,
        reviewedAt: v.reviewedAt
      }))
    };

    res.json({
      message: 'User data export completed',
      data: exportData
    });
  } catch (err) {
    console.error('Error exporting user data:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete user account (GDPR Right to be Forgotten)
 */
exports.deleteUserAccount = async (req, res) => {
  try {
    const { password, confirmDeletion } = req.body;

    if (!password || confirmDeletion !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        message: 'Password and confirmation text "DELETE MY ACCOUNT" are required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Check for active bookings
    const activeBookings = await Booking.find({
      $or: [{ client: req.user.id }, { provider: (await ProviderProfile.findOne({ user: req.user.id }))?._id }],
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete account with active bookings. Please complete or cancel them first.',
        activeBookings: activeBookings.length
      });
    }

    // Anonymize instead of deleting to maintain data integrity
    // This approach is GDPR-compliant as it removes personal identifiers
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.email = `deleted_${user._id}@anonymized.local`;
    user.phone = null;
    user.profileImage = null;
    user.password = await require('bcryptjs').hash('ACCOUNT_DELETED_' + Date.now(), 10);
    user.isVerified = false;
    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    user.twoFactorBackupCodes = [];
    user.preferences = new Map();
    user.favorites = [];

    await user.save();

    // Anonymize provider profile if exists
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (providerProfile) {
      providerProfile.bio = 'Account deleted';
      providerProfile.portfolio = [];
      providerProfile.workingHours = {};
      await providerProfile.save();
    }

    // Anonymize reviews
    await Review.updateMany(
      { reviewer: req.user.id },
      { $set: { comment: '[Comment removed - User deleted account]' } }
    );

    // Delete messages
    await Message.deleteMany({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    });

    // Delete verification documents
    await VerificationDocument.deleteMany({ user: req.user.id });

    // Delete consents
    await GDPRConsent.deleteMany({ user: req.user.id });

    res.json({
      message: 'Account successfully deleted. All personal data has been removed.',
      deletedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error deleting user account:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get privacy settings
 */
exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');

    const defaultSettings = {
      profileVisibility: user.preferences?.get('profileVisibility') || 'public',
      showEmail: user.preferences?.get('showEmail') === 'true',
      showPhone: user.preferences?.get('showPhone') === 'true',
      allowMessages: user.preferences?.get('allowMessages') !== 'false',
      allowReviews: user.preferences?.get('allowReviews') !== 'false',
      locationSharing: user.preferences?.get('locationSharing') !== 'false',
      analyticsTracking: user.preferences?.get('analyticsTracking') !== 'false',
      marketingEmails: user.preferences?.get('marketingEmails') !== 'false'
    };

    res.json(defaultSettings);
  } catch (err) {
    console.error('Error getting privacy settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update privacy settings
 */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const {
      profileVisibility,
      showEmail,
      showPhone,
      allowMessages,
      allowReviews,
      locationSharing,
      analyticsTracking,
      marketingEmails
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences
    if (profileVisibility) user.preferences.set('profileVisibility', profileVisibility);
    if (showEmail !== undefined) user.preferences.set('showEmail', String(showEmail));
    if (showPhone !== undefined) user.preferences.set('showPhone', String(showPhone));
    if (allowMessages !== undefined) user.preferences.set('allowMessages', String(allowMessages));
    if (allowReviews !== undefined) user.preferences.set('allowReviews', String(allowReviews));
    if (locationSharing !== undefined) user.preferences.set('locationSharing', String(locationSharing));
    if (analyticsTracking !== undefined) user.preferences.set('analyticsTracking', String(analyticsTracking));
    if (marketingEmails !== undefined) user.preferences.set('marketingEmails', String(marketingEmails));

    await user.save();

    // Record consent changes
    if (marketingEmails !== undefined) {
      const consent = new GDPRConsent({
        user: req.user.id,
        consentType: 'marketing_emails',
        granted: marketingEmails,
        version: '1.0',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      await consent.save();
    }

    if (analyticsTracking !== undefined) {
      const consent = new GDPRConsent({
        user: req.user.id,
        consentType: 'analytics_tracking',
        granted: analyticsTracking,
        version: '1.0',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      await consent.save();
    }

    if (locationSharing !== undefined) {
      const consent = new GDPRConsent({
        user: req.user.id,
        consentType: 'location_tracking',
        granted: locationSharing,
        version: '1.0',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      await consent.save();
    }

    res.json({
      message: 'Privacy settings updated successfully',
      settings: {
        profileVisibility: user.preferences.get('profileVisibility'),
        showEmail: user.preferences.get('showEmail') === 'true',
        showPhone: user.preferences.get('showPhone') === 'true',
        allowMessages: user.preferences.get('allowMessages') !== 'false',
        allowReviews: user.preferences.get('allowReviews') !== 'false',
        locationSharing: user.preferences.get('locationSharing') !== 'false',
        analyticsTracking: user.preferences.get('analyticsTracking') !== 'false',
        marketingEmails: user.preferences.get('marketingEmails') !== 'false'
      }
    });
  } catch (err) {
    console.error('Error updating privacy settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Request data download (generates downloadable file)
 */
exports.requestDataDownload = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Gather all user data (same as export but formatted for download)
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    const services = await Service.find({ provider: providerProfile?._id });
    const bookings = await Booking.find({
      $or: [{ client: req.user.id }, { provider: providerProfile?._id }]
    });
    const reviews = await Review.find({
      $or: [{ reviewer: req.user.id }, { reviewee: req.user.id }]
    });
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    });
    const consents = await GDPRConsent.find({ user: req.user.id });

    const downloadData = {
      exportDate: new Date().toISOString(),
      exportFormat: 'JSON',
      dataCategories: {
        personalInformation: user.toObject(),
        professionalProfile: providerProfile ? providerProfile.toObject() : null,
        services: services.map(s => s.toObject()),
        bookingHistory: bookings.map(b => b.toObject()),
        reviewsGiven: reviews.filter(r => r.reviewer.toString() === req.user.id).map(r => r.toObject()),
        reviewsReceived: reviews.filter(r => r.reviewee.toString() === req.user.id).map(r => r.toObject()),
        messageHistory: messages.map(m => m.toObject()),
        consentHistory: consents.map(c => c.toObject())
      },
      metadata: {
        totalBookings: bookings.length,
        totalReviews: reviews.length,
        totalMessages: messages.length,
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="my-data-${user._id}-${Date.now()}.json"`);

    res.send(JSON.stringify(downloadData, null, 2));
  } catch (err) {
    console.error('Error requesting data download:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
