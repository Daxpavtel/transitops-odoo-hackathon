const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const { validationResult } = require('express-validator');

exports.getFuelLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vehicle) {
      filter.vehicle = req.query.vehicle;
    }
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) {
        const end = new Date(req.query.to);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    const logs = await FuelLog.find(filter).populate('vehicle').sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

exports.createFuelLog = async (req, res, next) => {
  try {
    // Handle express-validator errors
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

    const { vehicle, liters, cost, date } = req.body;

    // Business rule: date must not be in the future
    const parsedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate > today) {
      return res.status(400).json({
        success: false,
        errors: [{ field: 'date', message: 'Fuel log date must not be in the future.' }]
      });
    }

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ success: false, errors: [{ field: 'vehicle', message: 'Vehicle not found' }] });
    }

    const log = new FuelLog({
      vehicle,
      liters,
      cost,
      date: parsedDate
    });

    await log.save();
    const populated = await log.populate('vehicle');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
