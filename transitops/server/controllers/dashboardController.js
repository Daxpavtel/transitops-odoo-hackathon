const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Optional filters from query params
    const vFilter = {};
    const tFilter = {};
    const dFilter = {};

    if (req.query.region) {
      // Mock region filtering since it's not strictly on schema, but we pass it anyway
      vFilter.region = req.query.region;
      tFilter.region = req.query.region;
    }

    // Run multiple aggregations concurrently
    const [
      activeVehiclesCount,
      availableVehiclesCount,
      inShopVehiclesCount,
      dispatchedTripsCount,
      draftTripsCount,
      driversOnDutyCount,
      recentTrips,
      vehicleStatusDistribution
    ] = await Promise.all([
      Vehicle.countDocuments({ ...vFilter, status: { $ne: 'Retired' } }),
      Vehicle.countDocuments({ ...vFilter, status: 'Available' }),
      Vehicle.countDocuments({ ...vFilter, status: 'In Shop' }),
      Trip.countDocuments({ ...tFilter, status: 'Dispatched' }),
      Trip.countDocuments({ ...tFilter, status: 'Draft' }),
      Driver.countDocuments({ ...dFilter, status: 'On Trip' }),
      Trip.find(tFilter).sort({ createdAt: -1 }).limit(5).populate('vehicle').populate('driver'),
      Vehicle.aggregate([
        { $match: vFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Handle fleet utilization calculation safely
    const vehiclesOnTripCount = activeVehiclesCount - availableVehiclesCount - inShopVehiclesCount; 
    // alternatively, just count On Trip. Let's do it directly for safety.
    const onTripVehiclesCount = await Vehicle.countDocuments({ ...vFilter, status: 'On Trip' });
    
    let fleetUtilization = 0;
    if (activeVehiclesCount > 0) {
      fleetUtilization = (onTripVehiclesCount / activeVehiclesCount) * 100;
    }

    // Format status distribution for frontend chart
    const formattedDistribution = vehicleStatusDistribution.map(item => ({
      name: item._id,
      value: item.count
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          activeVehicles: activeVehiclesCount,
          availableVehicles: availableVehiclesCount,
          vehiclesInMaintenance: inShopVehiclesCount,
          activeTrips: dispatchedTripsCount,
          pendingTrips: draftTripsCount,
          driversOnDuty: driversOnDutyCount,
          fleetUtilization: parseFloat(fleetUtilization.toFixed(1))
        },
        recentTrips,
        vehicleStatusDistribution: formattedDistribution
      }
    });

  } catch (error) {
    next(error);
  }
};
