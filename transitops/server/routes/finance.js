const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(auth);
router.use(authorize('canManageFuelExpenses'));

router.get('/operational-costs', financeController.getOperationalCosts);

module.exports = router;
