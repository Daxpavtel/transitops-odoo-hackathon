const MaintenanceLog = require('../models/MaintenanceLog');
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

// GET all maintenance logs
exports.getMaintenanceLogs = async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find()
      .populate('vehicle')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// CREATE maintenance log
exports.createMaintenanceLog = async (req, res, next) => {
  try {
    const { vehicle: vehicleId, serviceType, cost, date, status } = req.body;

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'vehicle', message: 'Vehicle not found' }]
      });
    }

    // Business Logic: If new record is Active, check if vehicle is already In Shop
    const logStatus = status || 'Active';
    if (logStatus === 'Active') {
      if (vehicle.status === 'In Shop') {
        return res.status(409).json({
          success: false,
          errors: [{ field: 'vehicle', message: 'Vehicle already in maintenance' }]
        });
      }

      // Update vehicle status to In Shop
      vehicle.status = 'In Shop';
      await vehicle.save();
    }

    const log = new MaintenanceLog({
      vehicle: vehicleId,
      serviceType,
      cost,
      date: new Date(date),
      status: logStatus
    });

    await log.save();
    
    // Populate vehicle details for response
    const populatedLog = await log.populate('vehicle');
    res.status(201).json({ success: true, data: populatedLog });
  } catch (error) {
    next(error);
  }
};

// UPDATE maintenance log
exports.updateMaintenanceLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, serviceType, cost, date } = req.body;

    const log = await MaintenanceLog.findById(id);
    if (!log) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Maintenance record not found' }]
      });
    }

    const vehicle = await Vehicle.findById(log.vehicle);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'vehicle', message: 'Vehicle associated with this log not found' }]
      });
    }

    // If changing status from Active to Closed
    if (status === 'Closed' && log.status === 'Active') {
      // Release vehicle back to Available, unless Retired
      if (vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    // If changing status from Closed back to Active (if allowed)
    if (status === 'Active' && log.status === 'Closed') {
      if (vehicle.status === 'In Shop') {
        return res.status(409).json({
          success: false,
          errors: [{ field: 'status', message: 'Vehicle already in maintenance' }]
        });
      }
      vehicle.status = 'In Shop';
      await vehicle.save();
    }

    if (status !== undefined) log.status = status;
    if (serviceType !== undefined) log.serviceType = serviceType;
    if (cost !== undefined) log.cost = cost;
    if (date !== undefined) log.date = new Date(date);

    await log.save();
    const populatedLog = await log.populate('vehicle');
    res.json({ success: true, data: populatedLog });
  } catch (error) {
    next(error);
  }
};

exports.handleValidationErrors = handleValidationErrors;
