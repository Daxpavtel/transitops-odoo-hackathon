const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Registered endpoints, protected for Analytics module
router.get('/analytics', auth, authorize('analytics', 'view'), reportsController.getAnalytics);
router.get('/export', auth, authorize('analytics', 'view'), reportsController.exportCSV);

module.exports = router;
