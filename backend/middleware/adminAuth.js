const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    // req.user should be set by the auth middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user from database to check role
    const user = await User.findById(req.user.id).select('role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ message: 'Server error during authorization' });
  }
};
