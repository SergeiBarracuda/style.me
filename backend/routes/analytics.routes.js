const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth');

// @route   GET api/analytics/dashboard
// @desc    Get provider's complete analytics dashboard
// @access  Private/Provider
router.get('/dashboard', auth, analyticsController.getProviderDashboard);

// @route   GET api/analytics/revenue
// @desc    Get detailed revenue analytics
// @access  Private/Provider
router.get('/revenue', auth, analyticsController.getRevenueAnalytics);

// @route   GET api/analytics/bookings
// @desc    Get booking analytics and patterns
// @access  Private/Provider
router.get('/bookings', auth, analyticsController.getBookingAnalytics);

// @route   GET api/analytics/clients
// @desc    Get client analytics and retention metrics
// @access  Private/Provider
router.get('/clients', auth, analyticsController.getClientAnalytics);

// @route   GET api/analytics/ratings
// @desc    Get rating and review analytics
// @access  Private/Provider
router.get('/ratings', auth, analyticsController.getRatingAnalytics);

// @route   POST api/analytics/refresh
// @desc    Manually refresh analytics data
// @access  Private/Provider
router.post('/refresh', auth, analyticsController.refreshAnalytics);

module.exports = router;
