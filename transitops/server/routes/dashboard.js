const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(auth);
router.use(authorize('canViewDashboard'));

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
