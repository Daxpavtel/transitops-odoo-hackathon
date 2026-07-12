const Driver = require('../models/Driver');
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

// Helper to add isExpired on the fly
const formatDriver = (driverDoc) => {
  const driver = driverDoc.toObject();
  const today = new Date();
  driver.isExpired = new Date(driver.licenseExpiry) < today;
  return driver;
};

// GET all drivers
exports.getDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    const formattedDrivers = drivers.map(formatDriver);
    res.json({ success: true, data: formattedDrivers });
  } catch (error) {
    next(error);
  }
};

// GET single driver
exports.getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Driver not found' }]
      });
    }
    res.json({ success: true, data: formatDriver(driver) });
  } catch (error) {
    next(error);
  }
};

// CREATE driver
exports.createDriver = async (req, res, next) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } = req.body;

    // Check unique license number
    const trimmedLicense = licenseNumber.trim();
    const existing = await Driver.findOne({ licenseNumber: trimmedLicense });

    if (existing) {
      return res.status(409).json({
        success: false,
        errors: [{ field: 'licenseNumber', message: 'License number already exists.' }]
      });
    }

    // Filter status: Client manual entry cannot set status to system-controlled "On Trip".
    // Can only toggle between Available, Off Duty, Suspended.
    let finalStatus = 'Available';
    if (status === 'Off Duty' || status === 'Suspended') {
      finalStatus = status;
    }

    // Normalize licenseExpiry to UTC
    const expiryDate = new Date(licenseExpiry);

    const driver = new Driver({
      name,
      licenseNumber: trimmedLicense,
      licenseCategory,
      licenseExpiry: expiryDate,
      contact,
      safetyScore: safetyScore !== undefined ? safetyScore : 100,
      status: finalStatus
    });

    await driver.save();
    res.status(201).json({ success: true, data: formatDriver(driver) });
  } catch (error) {
    next(error);
  }
};

// UPDATE driver
exports.updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Driver not found' }]
      });
    }

    const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } = req.body;

    // Unique check if license number changes
    if (licenseNumber) {
      const trimmedLicense = licenseNumber.trim();
      if (trimmedLicense !== driver.licenseNumber) {
        const existing = await Driver.findOne({ licenseNumber: trimmedLicense });
        if (existing) {
          return res.status(409).json({
            success: false,
            errors: [{ field: 'licenseNumber', message: 'License number already exists.' }]
          });
        }
        driver.licenseNumber = trimmedLicense;
      }
    }

    if (name !== undefined) driver.name = name;
    if (licenseCategory !== undefined) driver.licenseCategory = licenseCategory;
    
    if (licenseExpiry !== undefined) {
      driver.licenseExpiry = new Date(licenseExpiry);
    }
    
    if (contact !== undefined) driver.contact = contact;
    if (safetyScore !== undefined) driver.safetyScore = safetyScore;

    // Status: Client manual entry cannot set status to system-controlled "On Trip".
    // Available, Off Duty, Suspended are allowed.
    if (status !== undefined) {
      if (status === 'Available' || status === 'Off Duty' || status === 'Suspended') {
        driver.status = status;
      }
      // If it is 'On Trip', we ignore it (leave current status as is)
    }

    await driver.save();
    res.json({ success: true, data: formatDriver(driver) });
  } catch (error) {
    next(error);
  }
};

// DELETE driver
exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        errors: [{ field: 'id', message: 'Driver not found' }]
      });
    }
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.handleValidationErrors = handleValidationErrors;
