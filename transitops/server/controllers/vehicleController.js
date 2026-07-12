const Vehicle = require('../models/Vehicle');
const { validationResult } = require('express-validator');

// Helper to format validation errors
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

// GET all vehicles
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
};

// GET single vehicle
exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Vehicle not found' }]
      });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// CREATE vehicle
exports.createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;

    // Check unique case-insensitive registration number
    const trimmedReg = registrationNumber.trim();
    const existing = await Vehicle.findOne({
      registrationNumber: { $regex: new RegExp(`^${trimmedReg}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        errors: [{ field: 'registrationNumber', message: 'Registration number already exists.' }]
      });
    }

    // Filter status: Client manual entry cannot set status to system-controlled "On Trip" or "In Shop".
    // Default to 'Available' or 'Retired' if they passed it, otherwise fallback to 'Available'
    let finalStatus = 'Available';
    if (status === 'Retired') {
      finalStatus = 'Retired';
    }

    const vehicle = new Vehicle({
      registrationNumber: trimmedReg,
      name,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      status: finalStatus
    });

    await vehicle.save();
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// UPDATE vehicle
exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Vehicle not found' }]
      });
    }

    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;

    // Unique check if registration number changes
    if (registrationNumber) {
      const trimmedReg = registrationNumber.trim();
      if (trimmedReg.toLowerCase() !== vehicle.registrationNumber.toLowerCase()) {
        const existing = await Vehicle.findOne({
          registrationNumber: { $regex: new RegExp(`^${trimmedReg}$`, 'i') }
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            errors: [{ field: 'registrationNumber', message: 'Registration number already exists.' }]
          });
        }
        vehicle.registrationNumber = trimmedReg;
      }
    }

    // Name
    if (name !== undefined) vehicle.name = name;

    // Type
    if (type !== undefined) vehicle.type = type;

    // Max Load Capacity
    if (maxLoadCapacity !== undefined) vehicle.maxLoadCapacity = maxLoadCapacity;

    // Odometer: Cannot be manually decreased
    if (odometer !== undefined) {
      if (odometer < vehicle.odometer) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'odometer', message: 'Odometer cannot be manually decreased.' }]
        });
      }
      vehicle.odometer = odometer;
    }

    // Acquisition Cost
    if (acquisitionCost !== undefined) vehicle.acquisitionCost = acquisitionCost;

    // Status: Client can only toggle status between 'Available' and 'Retired'.
    // Ignore any other status changes (like 'On Trip' or 'In Shop')
    if (status !== undefined) {
      if (status === 'Available' || status === 'Retired') {
        vehicle.status = status;
      }
      // If it is 'On Trip' or 'In Shop', we ignore it (leave current status as is)
    }

    await vehicle.save();
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// DELETE vehicle
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Vehicle not found' }]
      });
    }
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.handleValidationErrors = handleValidationErrors;
