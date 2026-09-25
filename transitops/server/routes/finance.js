const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(auth);
router.use(authorize('fuelExpenses', 'view'));

// Fleet-wide operational cost (legacy path)
router.get('/operational-costs', financeController.getOperationalCosts);

// Fleet-wide summary (new path matching spec)
router.get('/operational-cost-summary', financeController.getFleetSummary);

// Per-vehicle operational cost
router.get('/vehicles/:id/operational-cost', financeController.getVehicleOperationalCost);

module.exports = router;
