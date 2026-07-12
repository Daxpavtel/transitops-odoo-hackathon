const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(auth);
router.use(authorize('canViewDashboard'));

// Single summary endpoint for the entire dashboard
router.get('/summary', dashboardController.getDashboardSummary);
// Legacy endpoint
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
