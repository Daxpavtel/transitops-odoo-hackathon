const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const validateFuel = [
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('liters').isFloat({ gt: 0, lt: 2000 }).withMessage('Liters must be between 0 and 2000'),
  body('cost').isFloat({ gt: 0 }).withMessage('Cost must be > 0'),
  body('date').isISO8601().withMessage('Invalid date format')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const { validationResult } = require('express-validator');

router.use(auth);
router.use(authorize('canManageFuelExpenses'));

router.get('/', fuelController.getFuelLogs);
router.post('/', validateFuel, handleValidationErrors, fuelController.createFuelLog);

module.exports = router;
