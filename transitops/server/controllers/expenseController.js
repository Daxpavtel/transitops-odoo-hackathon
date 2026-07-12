const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');

exports.getExpenses = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.trip) filter.trip = req.query.trip;

    const expenses = await Expense.find(filter)
      .populate('vehicle')
      .populate('trip')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { trip, vehicle, toll, other, maintenanceLinked } = req.body;

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ success: false, errors: [{ field: 'vehicle', message: 'Vehicle not found' }] });
    }

    const t = Number(toll || 0);
    const o = Number(other || 0);
    const m = Number(maintenanceLinked || 0);
    const total = t + o + m;

    const expense = new Expense({
      trip,
      vehicle,
      toll: t,
      other: o,
      maintenanceLinked: m,
      total
    });

    await expense.save();
    const populated = await expense.populate('vehicle trip');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const { toll, other, maintenanceLinked } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, errors: [{ field: 'id', message: 'Expense not found' }] });
    }

    if (toll !== undefined) expense.toll = Number(toll);
    if (other !== undefined) expense.other = Number(other);
    if (maintenanceLinked !== undefined) expense.maintenanceLinked = Number(maintenanceLinked);

    // Dynamically recalculate total
    expense.total = expense.toll + expense.other + expense.maintenanceLinked;

    await expense.save();
    const populated = await expense.populate('vehicle trip');
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
