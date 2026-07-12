const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.get('/operational-costs', financeController.getOperationalCosts);

module.exports = router;
