const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');

exports.getOperationalCosts = async (req, res, next) => {
  try {
    // We compute Total Operational Cost = sum(Fuel) + sum(Maintenance)
    // We can compute this fleet-wide or per vehicle if req.query.vehicle is provided

    const matchStage = {};
    if (req.query.vehicle) {
      // Cast to ObjectId for the aggregation match
      const mongoose = require('mongoose');
      matchStage.vehicle = new mongoose.Types.ObjectId(req.query.vehicle);
    }

    const fuelAgg = await FuelLog.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalFuelCost: { $sum: '$cost' } } }
    ]);

    const maintAgg = await MaintenanceLog.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalMaintenanceCost: { $sum: '$cost' } } }
    ]);

    const totalFuel = fuelAgg.length > 0 ? fuelAgg[0].totalFuelCost : 0;
    const totalMaintenance = maintAgg.length > 0 ? maintAgg[0].totalMaintenanceCost : 0;

    const totalOperationalCost = totalFuel + totalMaintenance;

    res.json({
      success: true,
      data: {
        totalFuel,
        totalMaintenance,
        totalOperationalCost
      }
    });
  } catch (error) {
    next(error);
  }
};
