const Service = require('../models/Service');
const ProviderProfile = require('../models/ProviderProfile');
const { validationResult } = require('express-validator');

// Create service
exports.createService = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, duration, price, images } = req.body;

    // Find provider profile
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Create new service
    const service = new Service({
      provider: providerProfile._id,
      name,
      description,
      category,
      duration,
      price,
      images: images || []
    });

    // Save service
    await service.save();

    // Add service to provider profile
    providerProfile.services.push(service._id);
    await providerProfile.save();

    res.status(201).json(service);
  } catch (err) {
    console.error('Error in createService controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, duration, price, images, isActive } = req.body;

    // Find service
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user is the service provider
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile || service.provider.toString() !== providerProfile._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update service fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (category) service.category = category;
    if (duration) service.duration = duration;
    if (price) service.price = price;
    if (images) service.images = images;
    if (isActive !== undefined) service.isActive = isActive;

    // Save service
    await service.save();

    res.json(service);
  } catch (err) {
    console.error('Error in updateService controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    // Find service
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user is the service provider
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile || service.provider.toString() !== providerProfile._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Remove service from provider profile
    providerProfile.services = providerProfile.services.filter(
      serviceId => serviceId.toString() !== req.params.id
    );
    await providerProfile.save();

    // Delete service
    await Service.findByIdAndDelete(req.params.id);

    res.json({ message: 'Service removed' });
  } catch (err) {
    console.error('Error in deleteService controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'firstName lastName profileImage'
        }
      });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (err) {
    console.error('Error in getServiceById controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get services by provider
exports.getServicesByProvider = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findById(req.params.providerId);
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const services = await Service.find({ provider: providerProfile._id, isActive: true });

    res.json(services);
  } catch (err) {
    console.error('Error in getServicesByProvider controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get services by category
exports.getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({ 
      category: req.params.category,
      isActive: true 
    }).populate({
      path: 'provider',
      populate: {
        path: 'user',
        select: 'firstName lastName profileImage'
      }
    });

    res.json(services);
  } catch (err) {
    console.error('Error in getServicesByCategory controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current provider's services
exports.getCurrentProviderServices = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const services = await Service.find({ provider: providerProfile._id });

    res.json(services);
  } catch (err) {
    console.error('Error in getCurrentProviderServices controller:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
