/**
 * Test Data Setup Script for Beauty Service Marketplace
 * 
 * This script creates test data in MongoDB Atlas for testing purposes.
 * 
 * Usage:
 * 1. Set MONGODB_URI environment variable
 * 2. Run: node setup-test-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models (simplified for the script)
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  profilePhoto: String,
  createdAt: Date,
  updatedAt: Date
});

const ProviderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  businessName: String,
  description: String,
  address: String,
  latitude: Number,
  longitude: Number,
  averageRating: Number,
  reviewCount: Number,
  createdAt: Date,
  updatedAt: Date
});

const ServiceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  name: String,
  description: String,
  price: Number,
  duration: Number,
  category: String,
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', UserSchema);
const Provider = mongoose.model('Provider', ProviderSchema);
const Service = mongoose.model('Service', ServiceSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  setupTestData();
})
.catch((err) => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

// Setup test data
async function setupTestData() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Provider.deleteMany({});
    await Service.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin',
      profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created admin user:', admin.email);

    // Create provider users and their services
    const providers = [];
    const services = [];

    // Provider 1: Hair Salon
    const provider1Password = await bcrypt.hash('provider123', 10);
    const provider1User = await User.create({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@hairsalon.com',
      password: provider1Password,
      role: 'provider',
      profilePhoto: 'https://randomuser.me/api/portraits/men/2.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const provider1 = await Provider.create({
      user: provider1User._id,
      businessName: 'Elite Hair Salon',
      description: 'Premium hair styling services for all hair types.',
      address: '123 Main St, New York, NY 10001',
      latitude: 40.7128,
      longitude: -74.0060,
      averageRating: 4.8,
      reviewCount: 42,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    providers.push(provider1);

    // Provider 1 Services
    const service1 = await Service.create({
      provider: provider1._id,
      name: 'Haircut',
      description: 'Professional haircut with wash and style.',
      price: 50,
      duration: 45,
      category: 'Hair',
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const service2 = await Service.create({
      provider: provider1._id,
      name: 'Hair Coloring',
      description: 'Full hair coloring service with premium products.',
      price: 120,
      duration: 90,
      category: 'Hair',
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    services.push(service1, service2);

    // Provider 2: Nail Salon
    const provider2Password = await bcrypt.hash('provider123', 10);
    const provider2User = await User.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@nailsalon.com',
      password: provider2Password,
      role: 'provider',
      profilePhoto: 'https://randomuser.me/api/portraits/women/2.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const provider2 = await Provider.create({
      user: provider2User._id,
      businessName: 'Luxury Nail Spa',
      description: 'Upscale nail salon offering manicures, pedicures, and nail art.',
      address: '456 Broadway, New York, NY 10013',
      latitude: 40.7234,
      longitude: -73.9981,
      averageRating: 4.5,
      reviewCount: 38,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    providers.push(provider2);

    // Provider 2 Services
    const service3 = await Service.create({
      provider: provider2._id,
      name: 'Manicure',
      description: 'Classic manicure with polish of your choice.',
      price: 35,
      duration: 30,
      category: 'Nails',
      imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const service4 = await Service.create({
      provider: provider2._id,
      name: 'Pedicure',
      description: 'Relaxing pedicure with foot massage and polish.',
      price: 45,
      duration: 45,
      category: 'Nails',
      imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    services.push(service3, service4);

    // Provider 3: Spa
    const provider3Password = await bcrypt.hash('provider123', 10);
    const provider3User = await User.create({
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael@spa.com',
      password: provider3Password,
      role: 'provider',
      profilePhoto: 'https://randomuser.me/api/portraits/men/3.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const provider3 = await Provider.create({
      user: provider3User._id,
      businessName: 'Tranquility Spa',
      description: 'Full-service spa offering massages, facials, and body treatments.',
      address: '789 Park Ave, New York, NY 10021',
      latitude: 40.7736,
      longitude: -73.9566,
      averageRating: 4.9,
      reviewCount: 56,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    providers.push(provider3);

    // Provider 3 Services
    const service5 = await Service.create({
      provider: provider3._id,
      name: 'Swedish Massage',
      description: '60-minute relaxing full body massage.',
      price: 90,
      duration: 60,
      category: 'Spa',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const service6 = await Service.create({
      provider: provider3._id,
      name: 'Facial Treatment',
      description: 'Rejuvenating facial with premium skincare products.',
      price: 75,
      duration: 45,
      category: 'Spa',
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    services.push(service5, service6);

    // Create client users
    const client1Password = await bcrypt.hash('client123', 10);
    const client1 = await User.create({
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah@test.com',
      password: client1Password,
      role: 'client',
      profilePhoto: 'https://randomuser.me/api/portraits/women/4.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const client2Password = await bcrypt.hash('client123', 10);
    const client2 = await User.create({
      firstName: 'Robert',
      lastName: 'Brown',
      email: 'robert@test.com',
      password: client2Password,
      role: 'client',
      profilePhoto: 'https://randomuser.me/api/portraits/men/4.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created test data:');
    console.log('- 1 Admin user');
    console.log(`- ${providers.length} Providers`);
    console.log(`- ${services.length} Services`);
    console.log('- 2 Client users');

    console.log('\nTest Accounts:');
    console.log('Admin: admin@test.com / admin123');
    console.log('Provider: john@hairsalon.com / provider123');
    console.log('Client: sarah@test.com / client123');

    mongoose.disconnect();
    console.log('\nDatabase setup complete!');
  } catch (error) {
    console.error('Error setting up test data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

