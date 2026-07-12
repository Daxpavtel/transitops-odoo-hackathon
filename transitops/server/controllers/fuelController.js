const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const { validationResult } = require('express-validator');

exports.getFuelLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vehicle) {
      filter.vehicle = req.query.vehicle;
    }
    const logs = await FuelLog.find(filter).populate('vehicle').sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

exports.createFuelLog = async (req, res, next) => {
  try {
    const { vehicle, liters, cost, date } = req.body;
    
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ success: false, errors: [{ field: 'vehicle', message: 'Vehicle not found' }] });
    }

    const log = new FuelLog({
      vehicle,
      liters,
      cost,
      date: date ? new Date(date) : new Date()
    });

    await log.save();
    const populated = await log.populate('vehicle');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
