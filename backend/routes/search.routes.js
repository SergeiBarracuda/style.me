const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// @route   GET api/search/providers
// @desc    Search providers by location
// @access  Public
router.get('/providers', searchController.searchProvidersByLocation);

// @route   GET api/search/services
// @desc    Search services by keyword
// @access  Public
router.get('/services', searchController.searchServicesByKeyword);

// @route   GET api/search/featured-providers
// @desc    Get featured providers
// @access  Public
router.get('/featured-providers', searchController.getFeaturedProviders);

// @route   GET api/search/popular-services
// @desc    Get popular services
// @access  Public
router.get('/popular-services', searchController.getPopularServices);

// @route   GET api/search/categories
// @desc    Get service categories
// @access  Public
router.get('/categories', searchController.getServiceCategories);

module.exports = router;
