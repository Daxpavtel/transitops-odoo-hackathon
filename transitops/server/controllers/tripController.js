const Trip = require('../models/Trip');
const statusEngine = require('../services/statusEngine');
const { validationResult } = require('express-validator');

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

exports.getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find()
      .populate('vehicle')
      .populate('driver')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

exports.createTrip = async (req, res, next) => {
  try {
    // Generate sequential tripCode (e.g. TR001)
    const count = await Trip.countDocuments();
    const tripCode = `TR${String(count + 1).padStart(3, '0')}`;

    const trip = new Trip({
      tripCode,
      ...req.body,
      status: 'Draft', // Hardcode Draft at creation
      createdBy: req.user.id // Requires auth middleware to populate req.user
    });

    await trip.save();
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.dispatchTrip = async (req, res, next) => {
  try {
    const trip = await statusEngine.dispatchTrip(req.params.id);
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.completeTrip = async (req, res, next) => {
  try {
    const { actualDistance, fuelConsumed } = req.body;
    const trip = await statusEngine.completeTrip(req.params.id, actualDistance, fuelConsumed);
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.cancelTrip = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const trip = await statusEngine.cancelTrip(req.params.id, cancellationReason);
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.handleValidationErrors = handleValidationErrors;
