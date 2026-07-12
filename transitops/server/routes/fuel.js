const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const validateFuel = [
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('liters').isFloat({ gt: 0 }).withMessage('Liters must be > 0'),
  body('cost').isFloat({ gt: 0 }).withMessage('Cost must be > 0'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
];

// Reusing handleValidationErrors from a shared util if needed, 
// for simplicity inline or skip strict check if handled in controller
router.use(auth);
router.use(authorize('canManageFuelExpenses'));

router.get('/', fuelController.getFuelLogs);
router.post('/', validateFuel, fuelController.createFuelLog);

module.exports = router;
