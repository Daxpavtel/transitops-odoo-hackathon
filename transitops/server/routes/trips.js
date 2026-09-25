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
  body('actualDistance').isFloat({ gt: 0 }).withMessage('Actual Distance must be > 0'),
  body('fuelConsumed').isFloat({ gt: 0 }).withMessage('Fuel Consumed must be > 0')
];

router.use(auth);

router.get('/', authorize('trips', 'view'), tripController.getTrips);
router.post('/', authorize('trips', 'edit'), tripValidationRules, tripController.handleValidationErrors, tripController.createTrip);

router.post('/:id/dispatch', authorize('trips', 'edit'), tripController.dispatchTrip);
router.post('/:id/complete', authorize('trips', 'edit'), completeValidationRules, tripController.handleValidationErrors, tripController.completeTrip);
router.post('/:id/cancel', authorize('trips', 'edit'), tripController.cancelTrip);

module.exports = router;
