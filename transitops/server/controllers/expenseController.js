const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const MaintenanceLog = require('../models/MaintenanceLog');
const { validationResult } = require('express-validator');

exports.getExpenses = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.trip) filter.trip = req.query.trip;

    const expenses = await Expense.find(filter)
      .populate('vehicle')
      .populate('trip')
      .sort({ createdAt: -1 });

    // For each expense, recompute maintenanceLinked from real maintenance records
    const enriched = await Promise.all(expenses.map(async (exp) => {
      const expObj = exp.toObject();

      // Sum all maintenance records for this vehicle
      const maintRecords = await MaintenanceLog.aggregate([
        { $match: { vehicle: exp.vehicle?._id || exp.vehicle } },
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
      ]);
      const maintLinked = maintRecords.length > 0 ? maintRecords[0].totalCost : 0;

      // Recompute total server-side
      expObj.maintenanceLinked = maintLinked;
      expObj.total = (expObj.toll || 0) + (expObj.other || 0) + maintLinked;

      // Derive status from linked trip if present
      if (expObj.trip && expObj.trip.status) {
        expObj.status = expObj.trip.status;
      } else {
        expObj.status = 'Available';
      }

      return expObj;
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

exports.createExpense = async (req, res, next) => {
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

    const { trip, vehicle, toll, other } = req.body;
    // Ignore any client-sent total or maintenanceLinked

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ success: false, errors: [{ field: 'vehicle', message: 'Vehicle not found' }] });
    }

    // If trip is provided, validate it exists
    if (trip) {
      const tripExists = await Trip.findById(trip);
      if (!tripExists) {
        return res.status(404).json({ success: false, errors: [{ field: 'trip', message: 'Trip not found' }] });
      }
    }

    // Server-computed: maintenance linked = sum of all maintenance records for this vehicle
    const maintRecords = await MaintenanceLog.aggregate([
      { $match: { vehicle: vehicleExists._id } },
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);
    const maintLinked = maintRecords.length > 0 ? maintRecords[0].totalCost : 0;

    const t = Number(toll || 0);
    const o = Number(other || 0);
    const total = t + o + maintLinked; // Server-computed total

    const expense = new Expense({
      trip: trip || undefined,
      vehicle,
      toll: t,
      other: o,
      maintenanceLinked: maintLinked,
      total
    });

    await expense.save();
    const populated = await expense.populate('vehicle trip');

    // Build response with derived status
    const expObj = populated.toObject();
    if (expObj.trip && expObj.trip.status) {
      expObj.status = expObj.trip.status;
    } else {
      expObj.status = 'Available';
    }

    res.status(201).json({ success: true, data: expObj });
  } catch (error) {
    next(error);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const { toll, other } = req.body;
    // Ignore client-sent total and maintenanceLinked
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, errors: [{ field: 'id', message: 'Expense not found' }] });
    }

    if (toll !== undefined) expense.toll = Number(toll);
    if (other !== undefined) expense.other = Number(other);

    // Re-fetch maintenance linked cost from real data
    const maintRecords = await MaintenanceLog.aggregate([
      { $match: { vehicle: expense.vehicle } },
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);
    expense.maintenanceLinked = maintRecords.length > 0 ? maintRecords[0].totalCost : 0;

    // Server recomputes total
    expense.total = expense.toll + expense.other + expense.maintenanceLinked;

    await expense.save();
    const populated = await expense.populate('vehicle trip');
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
