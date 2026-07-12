const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const auth = require('../middleware/auth');

// Role checking middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        errors: [{ field: 'role', message: 'Access denied: unauthorized role.' }]
      });
    }
    next();
  };
};

// Registered endpoints, protected for Financial Analyst and Fleet Manager roles
router.get('/analytics', auth, authorizeRoles('FinancialAnalyst', 'FleetManager'), reportsController.getAnalytics);
router.get('/export', auth, authorizeRoles('FinancialAnalyst', 'FleetManager'), reportsController.exportCSV);

module.exports = router;
