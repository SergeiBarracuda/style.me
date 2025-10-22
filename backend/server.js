require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const providerRoutes = require('./routes/provider.routes');
const serviceRoutes = require('./routes/service.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const searchRoutes = require('./routes/search.routes');
const messageRoutes = require('./routes/message.routes');
const twoFactorRoutes = require('./routes/twoFactor.routes');
const verificationRoutes = require('./routes/verification.routes');
const gdprRoutes = require('./routes/gdpr.routes');
const promotionRoutes = require('./routes/promotion.routes');
const loyaltyRoutes = require('./routes/loyalty.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const disputeRoutes = require('./routes/dispute.routes');
const featuredRoutes = require('./routes/featured.routes');
const cancellationRoutes = require('./routes/cancellation.routes');
const reminderRoutes = require('./routes/reminder.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/cancellation-policies', cancellationRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Beauty Marketplace API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Beauty Service Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      providers: '/api/providers',
      services: '/api/services',
      bookings: '/api/bookings',
      payments: '/api/payments',
      reviews: '/api/reviews',
      search: '/api/search',
      messages: '/api/messages',
      twoFactor: '/api/2fa',
      verification: '/api/verification',
      gdpr: '/api/gdpr',
      promotions: '/api/promotions',
      loyalty: '/api/loyalty',
      analytics: '/api/analytics',
      disputes: '/api/disputes',
      featured: '/api/featured',
      cancellationPolicies: '/api/cancellation-policies',
      reminders: '/api/reminders'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

module.exports = app; // For testing purposes

