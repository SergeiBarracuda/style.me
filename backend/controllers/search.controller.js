const ProviderProfile = require('../models/ProviderProfile');
const Service = require('../models/Service');
const User = require('../models/User');

// Search providers by location
exports.searchProvidersByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 10, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Build query
    const query = {
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    };

    // Add category filter if provided
    if (category) {
      // First find services in the category
      const services = await Service.find({ category, isActive: true });
      const serviceIds = services.map(service => service._id);

      // Then find providers who offer these services
      query.services = { $in: serviceIds };
    }

    // Find providers
    const providers = await ProviderProfile.find(query)
      .populate('user', ['firstName', 'lastName', 'profileImage'])
      .populate('services');

    res.json(providers);
  } catch (err) {
    console.error('Error in searchProvidersByLocation controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search services by keyword
exports.searchServicesByKeyword = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required' });
    }

    // Search services by name or description
    const services = await Service.find({
      isActive: true,
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }).populate({
      path: 'provider',
      populate: {
        path: 'user',
        select: 'firstName lastName profileImage'
      }
    });

    res.json(services);
  } catch (err) {
    console.error('Error in searchServicesByKeyword controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get featured providers
exports.getFeaturedProviders = async (req, res) => {
  try {
    // Get top-rated providers
    const providers = await ProviderProfile.find({ isVerified: true })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(10)
      .populate('user', ['firstName', 'lastName', 'profileImage'])
      .populate('services');

    res.json(providers);
  } catch (err) {
    console.error('Error in getFeaturedProviders controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get popular services
exports.getPopularServices = async (req, res) => {
  try {
    // In a real app, this would be based on booking counts
    // For now, just return some services
    const services = await Service.find({ isActive: true })
      .limit(10)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'firstName lastName profileImage'
        }
      });

    res.json(services);
  } catch (err) {
    console.error('Error in getPopularServices controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get service categories
exports.getServiceCategories = async (req, res) => {
  try {
    // Get distinct categories
    const categories = await Service.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Error in getServiceCategories controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
