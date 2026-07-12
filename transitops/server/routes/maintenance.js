const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const mongoose = require('mongoose');
const maintenanceController = require('../controllers/maintenanceController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const maintenanceValidationRules = [
  body('vehicle')
    .notEmpty().withMessage('Vehicle reference is required.')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid vehicle ID format.');
      }
      return true;
    }),

  body('serviceType')
    .trim()
    .notEmpty().withMessage('Service type is required.'),

  body('cost')
    .notEmpty().withMessage('Cost is required.')
    .isFloat({ min: 0 }).withMessage('Cost must be a number greater than or equal to 0.'),

  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid parseable date.')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      if (inputDate > today) {
        throw new Error('Date must not be in the future.');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['Active', 'Closed']).withMessage('Status must be either Active or Closed.')
];

const maintenanceUpdateRules = [
  body('vehicle')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid vehicle ID format.');
      }
      return true;
    }),

  body('serviceType')
    .optional()
    .trim()
    .notEmpty().withMessage('Service type cannot be empty.'),

  body('cost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Cost must be a number greater than or equal to 0.'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid parseable date.')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      if (inputDate > today) {
        throw new Error('Date must not be in the future.');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['Active', 'Closed']).withMessage('Status must be either Active or Closed.')
];

router.use(auth);

router.get('/', authorize('fleet', 'view'), maintenanceController.getMaintenanceLogs);
router.post('/', authorize('fleet', 'edit'), maintenanceValidationRules, maintenanceController.handleValidationErrors, maintenanceController.createMaintenanceLog);
router.patch('/:id', authorize('fleet', 'edit'), maintenanceUpdateRules, maintenanceController.handleValidationErrors, maintenanceController.updateMaintenanceLog);

module.exports = router;
