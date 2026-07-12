const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const { vehicleType, status } = req.query;

    // Build vehicle filter
    const vFilter = {};
    if (vehicleType && vehicleType !== 'All') vFilter.type = vehicleType;
    if (status && status !== 'All') vFilter.status = status;

    // Build trip filter based on vehicle IDs matching filter
    let vehicleIds = null;
    if (Object.keys(vFilter).length > 0) {
      const matchedVehicles = await Vehicle.find(vFilter, '_id');
      vehicleIds = matchedVehicles.map(v => v._id);
    }

    const tFilter = {};
    if (vehicleIds) tFilter.vehicle = { $in: vehicleIds };

    // Run all aggregations concurrently in a single endpoint call
    const [
      totalVehiclesExRetired,
      availableVehiclesCount,
      inShopVehiclesCount,
      onTripVehiclesCount,
      dispatchedTripsCount,
      draftTripsCount,
      driversOnDutyCount,
      recentTrips,
      vehicleStatusAgg,
      distinctTypes,
      distinctStatuses
    ] = await Promise.all([
      Vehicle.countDocuments({ ...vFilter, status: { $ne: 'Retired' } }),
      Vehicle.countDocuments({ ...vFilter, status: 'Available' }),
      Vehicle.countDocuments({ ...vFilter, status: 'In Shop' }),
      Vehicle.countDocuments({ ...vFilter, status: 'On Trip' }),
      Trip.countDocuments({ ...tFilter, status: 'Dispatched' }),
      Trip.countDocuments({ ...tFilter, status: 'Draft' }),
      Driver.countDocuments({ status: { $in: ['Available', 'On Trip'] } }),
      Trip.find({ ...tFilter, status: { $ne: 'Draft' } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('vehicle', 'registrationNumber type')
        .populate('driver', 'name'),
      Vehicle.aggregate([
        { $match: vFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Vehicle.distinct('type'),
      Vehicle.distinct('status')
    ]);

    // Compute fleet utilization: (On Trip / Active) * 100
    const activeVehicles = totalVehiclesExRetired;
    let fleetUtilizationPct = 0;
    if (activeVehicles > 0) {
      fleetUtilizationPct = parseFloat(((onTripVehiclesCount / activeVehicles) * 100).toFixed(1));
    }

    // Format vehicle status breakdown — ensure all 4 statuses present
    const vehicleStatusBreakdown = {};
    vehicleStatusAgg.forEach(item => {
      vehicleStatusBreakdown[item._id] = item.count;
    });
    ['Available', 'On Trip', 'In Shop', 'Retired'].forEach(s => {
      if (vehicleStatusBreakdown[s] === undefined) vehicleStatusBreakdown[s] = 0;
    });

    // Format recent trips with contextual ETA
    const formattedTrips = recentTrips.map(trip => {
      const t = trip.toObject();
      let eta = '\u2014';
      if (t.status === 'Dispatched') {
        const mins = Math.round((t.plannedDistance || 100) * 0.8);
        eta = mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
      } else if (t.status === 'Completed') {
        eta = 'Arrived';
      } else if (t.status === 'Cancelled') {
        eta = 'Cancelled';
      }
      if (!t.vehicle) eta = 'Awaiting vehicle';
      if (!t.driver) eta = 'Awaiting driver';

      return {
        _id: t._id,
        tripCode: t.tripCode,
        vehicle: t.vehicle?.registrationNumber || null,
        driver: t.driver?.name || null,
        status: t.status,
        source: t.source,
        destination: t.destination,
        eta
      };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          activeVehicles,
          availableVehicles: availableVehiclesCount,
          vehiclesInMaintenance: inShopVehiclesCount,
          activeTrips: dispatchedTripsCount,
          pendingTrips: draftTripsCount,
          driversOnDuty: driversOnDutyCount,
          fleetUtilizationPct
        },
        recentTrips: formattedTrips,
        vehicleStatusBreakdown,
        filters: {
          types: distinctTypes,
          statuses: distinctStatuses
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Legacy endpoint alias
exports.getDashboardStats = exports.getDashboardSummary;
