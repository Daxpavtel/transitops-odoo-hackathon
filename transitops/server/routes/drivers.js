const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const driverController = require('../controllers/driverController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const driverValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only letters and spaces.'),

  body('licenseNumber')
    .trim()
    .notEmpty().withMessage('License number is required.'),

  body('licenseCategory')
    .trim()
    .notEmpty().withMessage('License category is required.')
    .isIn(["LMV", "HMV", "MCWG", "Heavy Trailer"]).withMessage('Invalid license category.'),

  body('licenseExpiry')
    .notEmpty().withMessage('License expiry date is required.')
    .isISO8601().withMessage('License expiry must be a valid, parseable date.'),

  body('contact')
    .trim()
    .notEmpty().withMessage('Contact is required.')
    .matches(/^\d{10}$/).withMessage('Contact must be a valid 10-digit phone number.'),

  body('safetyScore')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Safety score must be between 0 and 100.'),

  body('status')
    .optional()
    .isIn(['Available', 'On Trip', 'Off Duty', 'Suspended']).withMessage('Invalid status value.')
];

const driverUpdateValidationRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only letters and spaces.'),

  body('licenseNumber')
    .optional()
    .trim(),

  body('licenseCategory')
    .optional()
    .trim()
    .isIn(["LMV", "HMV", "MCWG", "Heavy Trailer"]).withMessage('Invalid license category.'),

  body('licenseExpiry')
    .optional()
    .isISO8601().withMessage('License expiry must be a valid, parseable date.'),

  body('contact')
    .optional()
    .trim()
    .matches(/^\d{10}$/).withMessage('Contact must be a valid 10-digit phone number.'),

  body('safetyScore')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Safety score must be between 0 and 100.'),

  body('status')
    .optional()
    .isIn(['Available', 'On Trip', 'Off Duty', 'Suspended']).withMessage('Invalid status value.')
];

router.use(auth);

router.get('/', authorize('drivers', 'view'), driverController.getDrivers);
router.get('/:id', authorize('drivers', 'view'), driverController.getDriverById);
router.post('/', authorize('drivers', 'edit'), driverValidationRules, driverController.handleValidationErrors, driverController.createDriver);
router.patch('/:id', authorize('drivers', 'edit'), driverUpdateValidationRules, driverController.handleValidationErrors, driverController.updateDriver);
router.delete('/:id', authorize('drivers', 'edit'), driverController.deleteDriver);

module.exports = router;
