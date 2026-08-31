const dashboardService = require('../services/dashboardService');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const role = req.user?.role || 'FleetManager';
    const data = await dashboardService.getDashboardDataForRole(role, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Legacy endpoint alias
exports.getDashboardStats = exports.getDashboardSummary;
