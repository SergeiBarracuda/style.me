const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const serviceController = require('../controllers/service.controller');
const auth = require('../middleware/auth');

// @route   POST api/services
// @desc    Create service
// @access  Private
router.post(
  '/',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('duration', 'Duration is required').isNumeric(),
    check('price', 'Price is required').isNumeric()
  ],
  serviceController.createService
);

// @route   PUT api/services/:id
// @desc    Update service
// @access  Private
router.put('/:id', auth, serviceController.updateService);

// @route   DELETE api/services/:id
// @desc    Delete service
// @access  Private
router.delete('/:id', auth, serviceController.deleteService);

// @route   GET api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', serviceController.getServiceById);

// @route   GET api/services/provider/:providerId
// @desc    Get services by provider
// @access  Public
router.get('/provider/:providerId', serviceController.getServicesByProvider);

// @route   GET api/services/category/:category
// @desc    Get services by category
// @access  Public
router.get('/category/:category', serviceController.getServicesByCategory);

// @route   GET api/services/me
// @desc    Get current provider's services
// @access  Private
router.get('/me', auth, serviceController.getCurrentProviderServices);

module.exports = router;
