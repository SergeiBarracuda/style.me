const ProviderAnalytics = require('../models/ProviderAnalytics');
const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Message = require('../models/Message');

// @desc    Get provider's analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private/Provider
exports.getProviderDashboard = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Get or create analytics record
    let analytics = await ProviderAnalytics.findOne({ provider: providerProfile._id });

    if (!analytics) {
      analytics = await ProviderAnalytics.initializeForProvider(providerProfile._id);
    }

    // Refresh analytics data
    await refreshProviderAnalytics(providerProfile._id);

    // Get updated analytics
    analytics = await ProviderAnalytics.findOne({ provider: providerProfile._id })
      .populate('popularServices.service', 'name price');

    res.json({
      analytics,
      lastUpdated: analytics.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching provider dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private/Provider
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get payments
    const payments = await Payment.find({
      provider: providerProfile._id,
      status: 'completed',
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    }).populate('booking', 'scheduledDate service');

    // Calculate revenue by time period
    const revenueByDay = {};
    const revenueByMonth = {};
    const revenueByService = {};

    payments.forEach(payment => {
      // By day
      const day = payment.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + payment.providerEarnings;

      // By month
      const month = payment.createdAt.toISOString().substring(0, 7);
      revenueByMonth[month] = (revenueByMonth[month] || 0) + payment.providerEarnings;

      // By service
      if (payment.booking && payment.booking.service) {
        const serviceId = payment.booking.service.toString();
        if (!revenueByService[serviceId]) {
          revenueByService[serviceId] = {
            revenue: 0,
            count: 0
          };
        }
        revenueByService[serviceId].revenue += payment.providerEarnings;
        revenueByService[serviceId].count += 1;
      }
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.providerEarnings, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.platformFee, 0);
    const averageRevenue = payments.length > 0 ? totalRevenue / payments.length : 0;

    res.json({
      totalRevenue,
      totalCommission,
      averageRevenue,
      transactionCount: payments.length,
      revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
      revenueByService: Object.entries(revenueByService).map(([serviceId, data]) => ({
        serviceId,
        ...data
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
  }
};

// @desc    Get booking analytics
// @route   GET /api/analytics/bookings
// @access  Private/Provider
exports.getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get bookings
    const bookings = await Booking.find({
      provider: providerProfile._id,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    });

    // Calculate booking metrics
    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      'no-show': 0
    };

    const bookingsByDay = {};
    const bookingsByHour = {};
    const bookingsByDayOfWeek = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };

    bookings.forEach(booking => {
      // Status breakdown
      statusBreakdown[booking.status] = (statusBreakdown[booking.status] || 0) + 1;

      // By day
      const day = booking.scheduledDate.toISOString().split('T')[0];
      bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;

      // By hour
      const hour = booking.scheduledDate.getHours();
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;

      // By day of week
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][booking.scheduledDate.getDay()];
      bookingsByDayOfWeek[dayOfWeek] += 1;
    });

    // Calculate rates
    const completionRate = bookings.length > 0
      ? (statusBreakdown.completed / bookings.length) * 100
      : 0;

    const cancellationRate = bookings.length > 0
      ? (statusBreakdown.cancelled / bookings.length) * 100
      : 0;

    // Find peak hours
    const peakHour = Object.entries(bookingsByHour)
      .sort(([, a], [, b]) => b - a)[0];

    // Find peak day
    const peakDay = Object.entries(bookingsByDayOfWeek)
      .sort(([, a], [, b]) => b - a)[0];

    res.json({
      totalBookings: bookings.length,
      statusBreakdown,
      completionRate: completionRate.toFixed(2),
      cancellationRate: cancellationRate.toFixed(2),
      bookingsByDay: Object.entries(bookingsByDay).map(([date, count]) => ({ date, count })),
      bookingsByHour: Object.entries(bookingsByHour)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour),
      bookingsByDayOfWeek,
      peakHour: peakHour ? { hour: parseInt(peakHour[0]), bookings: peakHour[1] } : null,
      peakDay: peakDay ? { day: peakDay[0], bookings: peakDay[1] } : null
    });
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ message: 'Error fetching booking analytics', error: error.message });
  }
};

// @desc    Get client analytics
// @route   GET /api/analytics/clients
// @access  Private/Provider
exports.getClientAnalytics = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Get all completed bookings
    const bookings = await Booking.find({
      provider: providerProfile._id,
      status: 'completed'
    }).populate('client', 'firstName lastName email profileImage');

    // Count unique clients
    const clientBookingCount = {};
    bookings.forEach(booking => {
      const clientId = booking.client._id.toString();
      if (!clientBookingCount[clientId]) {
        clientBookingCount[clientId] = {
          client: booking.client,
          bookingCount: 0,
          totalSpent: 0,
          lastBooking: null
        };
      }
      clientBookingCount[clientId].bookingCount += 1;
      clientBookingCount[clientId].totalSpent += booking.price;
      if (!clientBookingCount[clientId].lastBooking ||
          booking.scheduledDate > clientBookingCount[clientId].lastBooking) {
        clientBookingCount[clientId].lastBooking = booking.scheduledDate;
      }
    });

    const uniqueClients = Object.keys(clientBookingCount).length;
    const returningClients = Object.values(clientBookingCount)
      .filter(c => c.bookingCount > 1).length;

    const retentionRate = uniqueClients > 0
      ? (returningClients / uniqueClients) * 100
      : 0;

    // Get new clients this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newClientsThisMonth = Object.values(clientBookingCount)
      .filter(c => {
        const firstBooking = bookings.find(b => b.client._id.toString() === c.client._id.toString());
        return firstBooking && firstBooking.createdAt >= firstDayOfMonth;
      }).length;

    // Top clients by revenue
    const topClients = Object.values(clientBookingCount)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      totalClients: uniqueClients,
      returningClients,
      newClientsThisMonth,
      retentionRate: retentionRate.toFixed(2),
      averageBookingsPerClient: uniqueClients > 0
        ? (bookings.length / uniqueClients).toFixed(2)
        : 0,
      topClients
    });
  } catch (error) {
    console.error('Error fetching client analytics:', error);
    res.status(500).json({ message: 'Error fetching client analytics', error: error.message });
  }
};

// @desc    Get rating and review analytics
// @route   GET /api/analytics/ratings
// @access  Private/Provider
exports.getRatingAnalytics = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Get all reviews
    const reviews = await Review.find({
      reviewee: providerProfile.user,
      reviewType: 'client_to_provider'
    }).sort({ createdAt: -1 });

    if (reviews.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentReviews: [],
        trend: 'stable'
      });
    }

    // Calculate average rating
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating] += 1;
    });

    // Get recent reviews
    const recentReviews = reviews.slice(0, 10);

    // Calculate trend
    let trend = 'stable';
    if (reviews.length >= 10) {
      const recentAvg = recentReviews.slice(0, 5)
        .reduce((sum, r) => sum + r.rating, 0) / 5;
      const olderAvg = recentReviews.slice(5, 10)
        .reduce((sum, r) => sum + r.rating, 0) / 5;

      if (recentAvg > olderAvg + 0.3) {
        trend = 'increasing';
      } else if (recentAvg < olderAvg - 0.3) {
        trend = 'decreasing';
      }
    }

    // Reviews by month
    const reviewsByMonth = {};
    reviews.forEach(review => {
      const month = review.createdAt.toISOString().substring(0, 7);
      if (!reviewsByMonth[month]) {
        reviewsByMonth[month] = { count: 0, totalRating: 0 };
      }
      reviewsByMonth[month].count += 1;
      reviewsByMonth[month].totalRating += review.rating;
    });

    res.json({
      averageRating: averageRating.toFixed(2),
      totalReviews: reviews.length,
      ratingDistribution,
      recentReviews,
      trend,
      reviewsByMonth: Object.entries(reviewsByMonth).map(([month, data]) => ({
        month,
        count: data.count,
        averageRating: (data.totalRating / data.count).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error fetching rating analytics:', error);
    res.status(500).json({ message: 'Error fetching rating analytics', error: error.message });
  }
};

// @desc    Refresh provider analytics (background task)
// @route   POST /api/analytics/refresh
// @access  Private/Provider
exports.refreshAnalytics = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    await refreshProviderAnalytics(providerProfile._id);

    res.json({ message: 'Analytics refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing analytics:', error);
    res.status(500).json({ message: 'Error refreshing analytics', error: error.message });
  }
};

// Helper function to refresh provider analytics
async function refreshProviderAnalytics(providerId) {
  try {
    let analytics = await ProviderAnalytics.findOne({ provider: providerId });

    if (!analytics) {
      analytics = await ProviderAnalytics.initializeForProvider(providerId);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get all bookings
    const allBookings = await Booking.find({ provider: providerId });

    // Get payments
    const allPayments = await Payment.find({
      provider: providerId,
      status: 'completed'
    });

    // Update booking metrics
    analytics.bookings.total = allBookings.length;
    analytics.bookings.completed = allBookings.filter(b => b.status === 'completed').length;
    analytics.bookings.cancelled = allBookings.filter(b => b.status === 'cancelled').length;
    analytics.bookings.upcoming = allBookings.filter(b =>
      b.status === 'confirmed' && b.scheduledDate > now
    ).length;
    analytics.bookings.currentMonth = allBookings.filter(b =>
      b.createdAt >= startOfMonth
    ).length;

    analytics.updateCompletionRate();

    // Update revenue metrics
    analytics.revenue.total = allPayments.reduce((sum, p) => sum + p.providerEarnings, 0);
    analytics.revenue.currentMonth = allPayments
      .filter(p => p.createdAt >= startOfMonth)
      .reduce((sum, p) => sum + p.providerEarnings, 0);
    analytics.revenue.lastMonth = allPayments
      .filter(p => p.createdAt >= startOfLastMonth && p.createdAt <= endOfLastMonth)
      .reduce((sum, p) => sum + p.providerEarnings, 0);
    analytics.revenue.currentYear = allPayments
      .filter(p => p.createdAt >= startOfYear)
      .reduce((sum, p) => sum + p.providerEarnings, 0);

    analytics.updateAverageValue();

    // Update client metrics
    const uniqueClients = new Set(allBookings.map(b => b.client.toString()));
    const clientBookingCount = {};
    allBookings.forEach(b => {
      const clientId = b.client.toString();
      clientBookingCount[clientId] = (clientBookingCount[clientId] || 0) + 1;
    });
    const returningClients = Object.values(clientBookingCount).filter(count => count > 1).length;

    analytics.clients.total = uniqueClients.size;
    analytics.clients.returning = returningClients;
    analytics.clients.newThisMonth = allBookings
      .filter(b => b.createdAt >= startOfMonth)
      .map(b => b.client.toString())
      .filter((v, i, a) => a.indexOf(v) === i).length;

    analytics.updateRetentionRate();

    // Update financial metrics
    analytics.financial.totalCommissionPaid = allPayments.reduce((sum, p) => sum + p.platformFee, 0);
    analytics.financial.netEarnings = analytics.revenue.total - analytics.financial.totalCommissionPaid;
    analytics.financial.pendingPayouts = allPayments
      .filter(p => p.payoutStatus === 'pending')
      .reduce((sum, p) => sum + p.providerEarnings, 0);
    analytics.financial.paidOut = allPayments
      .filter(p => p.payoutStatus === 'paid')
      .reduce((sum, p) => sum + p.providerEarnings, 0);

    analytics.calculateGrowth();
    analytics.lastUpdated = new Date();

    await analytics.save();

    return analytics;
  } catch (error) {
    console.error('Error refreshing provider analytics:', error);
    throw error;
  }
}

module.exports = exports;
