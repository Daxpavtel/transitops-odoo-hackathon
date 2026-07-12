const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { body } = require('express-validator');

// Assuming you have an auth middleware
// const auth = require('../middleware/auth');
// router.use(auth);

// Validation array for creation
const tripValidation = [
  body('source').notEmpty().withMessage('Source is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('driver').isMongoId().withMessage('Invalid Driver ID'),
  body('cargoWeight').isFloat({ gt: 0 }).withMessage('Cargo Weight must be > 0'),
  body('plannedDistance').isFloat({ gt: 0 }).withMessage('Planned Distance must be > 0'),
];

router.get('/', tripController.getTrips);
router.post('/', tripValidation, tripController.handleValidationErrors, tripController.createTrip);

router.post('/:id/dispatch', tripController.dispatchTrip);
router.post('/:id/complete', tripController.completeTrip);
router.post('/:id/cancel', tripController.cancelTrip);

module.exports = router;
