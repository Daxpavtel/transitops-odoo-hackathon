const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const mongoose = require('mongoose');

/**
 * Shared aggregation function: computes operational cost (Fuel + Maintenance)
 * for a given vehicle filter. This is the SINGLE source of truth used by both
 * the Fuel & Expenses page banner AND the Reports & Analytics KPI card.
 *
 * @param {Object} vehicleFilter - Optional { vehicle: ObjectId } to scope to one vehicle
 * @returns {Object} { fuelCost, maintenanceCost, totalOperationalCost }
 */
const computeOperationalCost = async (vehicleFilter = {}) => {
  const fuelAgg = await FuelLog.aggregate([
    { $match: vehicleFilter },
    { $group: { _id: null, totalFuelCost: { $sum: '$cost' } } }
  ]);

  const maintAgg = await MaintenanceLog.aggregate([
    { $match: vehicleFilter },
    { $group: { _id: null, totalMaintenanceCost: { $sum: '$cost' } } }
  ]);

  const fuelCost = fuelAgg.length > 0 ? fuelAgg[0].totalFuelCost : 0;
  const maintenanceCost = maintAgg.length > 0 ? maintAgg[0].totalMaintenanceCost : 0;
  const totalOperationalCost = fuelCost + maintenanceCost;

  return { fuelCost, maintenanceCost, totalOperationalCost };
};

// GET /api/finance/operational-costs  (fleet-wide or per-vehicle with ?vehicle=)
exports.getOperationalCosts = async (req, res, next) => {
  try {
    const matchStage = {};
    if (req.query.vehicle) {
      matchStage.vehicle = new mongoose.Types.ObjectId(req.query.vehicle);
    }

    const result = await computeOperationalCost(matchStage);

    res.json({
      success: true,
      data: {
        totalFuel: result.fuelCost,
        totalMaintenance: result.maintenanceCost,
        totalOperationalCost: result.totalOperationalCost
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/:id/operational-cost  (single vehicle)
exports.getVehicleOperationalCost = async (req, res, next) => {
  try {
    const vehicleId = new mongoose.Types.ObjectId(req.params.id);
    const result = await computeOperationalCost({ vehicle: vehicleId });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/operational-cost/summary  (fleet-wide summary, same formula)
exports.getFleetSummary = async (req, res, next) => {
  try {
    const matchStage = {};
    if (req.query.vehicle) {
      matchStage.vehicle = new mongoose.Types.ObjectId(req.query.vehicle);
    }

    const result = await computeOperationalCost(matchStage);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Export the shared function so Reports & Analytics can import it too
exports.computeOperationalCost = computeOperationalCost;
