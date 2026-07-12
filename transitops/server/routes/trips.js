const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Validation array for creation
const tripValidationRules = [
  body('source').notEmpty().withMessage('Source is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('driver').isMongoId().withMessage('Invalid Driver ID'),
  body('cargoWeight').isFloat({ gt: 0 }).withMessage('Cargo Weight must be > 0'),
  body('plannedDistance').isFloat({ gt: 0 }).withMessage('Planned Distance must be > 0'),
];

const completeValidationRules = [
  body('actualDistance').isFloat({ gt: 0 }).withMessage('Actual Distance must be > 0')
];

router.use(auth);

// All trip routes require canDispatchTrips
router.use(authorize('canDispatchTrips'));

router.get('/', tripController.getTrips);
router.post('/', tripValidationRules, tripController.handleValidationErrors, tripController.createTrip);

router.post('/:id/dispatch', tripController.dispatchTrip);
router.post('/:id/complete', completeValidationRules, tripController.handleValidationErrors, tripController.completeTrip);
router.post('/:id/cancel', tripController.cancelTrip);

module.exports = router;
