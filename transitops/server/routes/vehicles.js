const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const vehicleController = require('../controllers/vehicleController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const vehicleValidationRules = [
  body('registrationNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required.')
    .isAlphanumeric().withMessage('Registration number must be alphanumeric.')
    .isLength({ min: 4, max: 12 }).withMessage('Registration number must be between 4 and 12 characters.'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),

  body('type')
    .trim()
    .notEmpty().withMessage('Type is required.')
    .isIn(['Van', 'Truck', 'Mini']).withMessage('Type must be either Van, Truck, or Mini.'),

  body('maxLoadCapacity')
    .notEmpty().withMessage('Max load capacity is required.')
    .isFloat({ gt: 0 }).withMessage('Max load capacity must be a number greater than 0.'),

  body('odometer')
    .optional()
    .isFloat({ min: 0 }).withMessage('Odometer must be a number greater than or equal to 0.'),

  body('acquisitionCost')
    .notEmpty().withMessage('Acquisition cost is required.')
    .isFloat({ gt: 0 }).withMessage('Acquisition cost must be a number greater than 0.'),

  body('status')
    .optional()
    .isIn(['Available', 'On Trip', 'In Shop', 'Retired']).withMessage('Invalid status value.')
];

const vehicleUpdateValidationRules = [
  body('registrationNumber')
    .optional()
    .trim()
    .isAlphanumeric().withMessage('Registration number must be alphanumeric.')
    .isLength({ min: 4, max: 12 }).withMessage('Registration number must be between 4 and 12 characters.'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),

  body('type')
    .optional()
    .trim()
    .isIn(['Van', 'Truck', 'Mini']).withMessage('Type must be either Van, Truck, or Mini.'),

  body('maxLoadCapacity')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Max load capacity must be a number greater than 0.'),

  body('odometer')
    .optional()
    .isFloat({ min: 0 }).withMessage('Odometer must be a number greater than or equal to 0.'),

  body('acquisitionCost')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Acquisition cost must be a number greater than 0.'),

  body('status')
    .optional()
    .isIn(['Available', 'On Trip', 'In Shop', 'Retired']).withMessage('Invalid status value.')
];

router.use(auth);
router.use(authorize('canManageVehicles'));

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', vehicleValidationRules, vehicleController.handleValidationErrors, vehicleController.createVehicle);
router.patch('/:id', vehicleUpdateValidationRules, vehicleController.handleValidationErrors, vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
