const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const MaintenanceLog = require('../models/MaintenanceLog');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');

exports.getDashboardDataForRole = async (role, queryParams = {}) => {
  const { vehicleType, status } = queryParams;

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

  // Common Aggregations
  const [
    totalVehiclesExRetired,
    availableVehiclesCount,
    inShopVehiclesCount,
    onTripVehiclesCount,
    dispatchedTripsCount,
    draftTripsCount,
    driversOnDutyCount,
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
    Vehicle.aggregate([
      { $match: vFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Vehicle.distinct('type'),
    Vehicle.distinct('status')
  ]);

  // Compute fleet utilization: (On Trip / Active Vehicles) * 100
  let fleetUtilizationPct = 0;
  if (totalVehiclesExRetired > 0) {
    fleetUtilizationPct = parseFloat(((onTripVehiclesCount / totalVehiclesExRetired) * 100).toFixed(1));
  }

  // Format vehicle status breakdown
  const vehicleStatusBreakdown = { Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0 };
  vehicleStatusAgg.forEach(item => {
    vehicleStatusBreakdown[item._id] = item.count;
  });

  const filterOptions = {
    types: distinctTypes,
    statuses: distinctStatuses
  };

  // Branch data based on Role
  if (role === 'FleetManager') {
    // 2.1 Fleet Manager — Asset & Maintenance Focus
    const recentMaintenance = await MaintenanceLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'registrationNumber name');

    return {
      role,
      title: 'Fleet Manager Overview',
      subtitle: 'Asset utilization, shop status, and vehicle service logs.',
      kpis: [
        { id: 'activeVehicles', label: 'Active Vehicles', value: totalVehiclesExRetired, suffix: '', type: 'number', color: '#6366f1' },
        { id: 'availableVehicles', label: 'Available Vehicles', value: availableVehiclesCount, suffix: '', type: 'number', color: '#10b981' },
        { id: 'vehiclesInMaintenance', label: 'In Maintenance', value: inShopVehiclesCount, suffix: '', type: 'number', color: '#f59e0b' },
        { id: 'fleetUtilizationPct', label: 'Fleet Utilization', value: fleetUtilizationPct, suffix: '%', isPercentage: true, type: 'percent', color: '#3b82f6' }
      ],
      widgets: {
        vehicleStatusBreakdown,
        recentMaintenance: recentMaintenance.map(m => ({
          _id: m._id,
          vehicle: m.vehicle?.registrationNumber || 'N/A',
          vehicleName: m.vehicle?.name || 'N/A',
          serviceType: m.serviceType,
          cost: m.cost,
          date: m.date,
          status: m.status
        }))
      },
      filterOptions
    };
  }

  if (role === 'Dispatcher') {
    // 2.2 Dispatcher — Operations Focus
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [completedTodayCount, recentTrips] = await Promise.all([
      Trip.countDocuments({ ...tFilter, status: 'Completed', updatedAt: { $gte: todayStart } }),
      Trip.find({ ...tFilter, status: { $ne: 'Draft' } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('vehicle', 'registrationNumber type')
        .populate('driver', 'name')
    ]);

    const formattedTrips = recentTrips.map(trip => {
      const t = trip.toObject();
      let eta = '—';
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

    return {
      role,
      title: 'Dispatcher Live Operations',
      subtitle: 'Active dispatches, pending trips, and driver assignments.',
      kpis: [
        { id: 'activeTrips', label: 'Active Trips', value: dispatchedTripsCount, suffix: '', type: 'number', color: '#3b82f6' },
        { id: 'pendingTrips', label: 'Pending (Draft)', value: draftTripsCount, suffix: '', type: 'number', color: '#f59e0b' },
        { id: 'availableVehicles', label: 'Available Vehicles', value: availableVehiclesCount, suffix: '', type: 'number', color: '#10b981' },
        { id: 'driversOnDuty', label: 'Drivers On Duty', value: driversOnDutyCount, suffix: '', type: 'number', color: '#6366f1' }
      ],
      widgets: {
        recentTrips: formattedTrips,
        liveBoardSummary: {
          dispatched: dispatchedTripsCount,
          pending: draftTripsCount,
          completedToday: completedTodayCount,
          availableVehicles: availableVehiclesCount
        }
      },
      filterOptions
    };
  }

  if (role === 'SafetyOfficer') {
    // 2.3 Safety Officer — Compliance Focus
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [drivers, driverStatusAgg] = await Promise.all([
      Driver.find().sort({ licenseExpiry: 1 }),
      Driver.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const driverStatusBreakdown = { Available: 0, 'On Trip': 0, 'Off Duty': 0, Suspended: 0 };
    driverStatusAgg.forEach(item => {
      driverStatusBreakdown[item._id] = item.count;
    });

    let suspendedDriversCount = 0;
    let expiringLicensesCount = 0;
    let totalSafetyScore = 0;

    const expiringLicensesList = [];

    drivers.forEach(d => {
      if (d.status === 'Suspended') suspendedDriversCount++;
      totalSafetyScore += (d.safetyScore || 95);

      const expiryDate = new Date(d.licenseExpiry);
      const diffMs = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining < 0;

      if (expiryDate <= in30Days) {
        expiringLicensesCount++;
        expiringLicensesList.push({
          _id: d._id,
          name: d.name,
          licenseNumber: d.licenseNumber,
          licenseCategory: d.licenseCategory || 'LMV',
          licenseExpiry: d.licenseExpiry,
          daysRemaining,
          isExpired,
          status: d.status
        });
      }
    });

    const avgSafetyScore = drivers.length > 0 
      ? parseFloat((totalSafetyScore / drivers.length).toFixed(1)) 
      : 95;

    return {
      role,
      title: 'Safety & Compliance Dashboard',
      subtitle: 'Driver qualifications, safety scores, and license expiration alerts.',
      kpis: [
        { id: 'driversOnDuty', label: 'Drivers On Duty', value: driversOnDutyCount, suffix: '', type: 'number', color: '#6366f1' },
        { id: 'expiringLicenses', label: 'Licenses Expiring Soon', value: expiringLicensesCount, suffix: '', type: 'number', color: '#ef4444' },
        { id: 'suspendedDrivers', label: 'Suspended Drivers', value: suspendedDriversCount, suffix: '', type: 'number', color: '#f59e0b' },
        { id: 'avgSafetyScore', label: 'Avg Safety Score', value: avgSafetyScore, suffix: '/100', type: 'score', color: '#10b981' }
      ],
      widgets: {
        driverStatusBreakdown,
        expiringLicensesList
      },
      filterOptions
    };
  }

  if (role === 'FinancialAnalyst') {
    // 2.4 Financial Analyst — Cost & Performance Focus
    const [trips, expenses, fuelLogs, maintenanceLogs, vehicles] = await Promise.all([
      Trip.find({ status: { $in: ['Completed', 'Dispatched'] }, ...tFilter }),
      Expense.find(tFilter),
      FuelLog.find(),
      MaintenanceLog.find(),
      Vehicle.find(vFilter)
    ]);

    let totalRevenue = 0;
    let totalDistance = 0;
    let totalFuelConsumed = 0;

    trips.forEach(t => {
      const dist = t.actualDistance || t.plannedDistance || 0;
      totalRevenue += dist * 20; // $20 per km
      totalDistance += dist;
      totalFuelConsumed += t.fuelConsumed || 0;
    });

    let totalExpenseModel = 0;
    expenses.forEach(e => { totalExpenseModel += e.total || 0; });

    let totalFuelCost = 0;
    fuelLogs.forEach(f => { totalFuelCost += f.cost || 0; });

    let totalMaintCost = 0;
    maintenanceLogs.forEach(m => { totalMaintCost += m.cost || 0; });

    const totalExpense = totalExpenseModel + totalFuelCost + totalMaintCost;
    const netProfit = totalRevenue - totalExpense;

    // Fuel Efficiency (km / L)
    const avgFuelEfficiency = totalFuelConsumed > 0 
      ? parseFloat((totalDistance / totalFuelConsumed).toFixed(1)) 
      : 0;

    // Average Vehicle ROI %
    const avgVehicleRoiPct = totalExpense > 0 
      ? parseFloat(((netProfit / totalExpense) * 100).toFixed(1)) 
      : 0;

    // Top Costliest Vehicles
    const vehicleCostMap = {};
    vehicles.forEach(v => {
      vehicleCostMap[v._id.toString()] = {
        registrationNumber: v.registrationNumber,
        name: v.name,
        type: v.type,
        fuelCost: 0,
        maintCost: 0,
        otherCost: 0,
        totalCost: 0
      };
    });

    fuelLogs.forEach(f => {
      const vId = f.vehicle?.toString();
      if (vehicleCostMap[vId]) {
        vehicleCostMap[vId].fuelCost += f.cost || 0;
        vehicleCostMap[vId].totalCost += f.cost || 0;
      }
    });

    maintenanceLogs.forEach(m => {
      const vId = m.vehicle?.toString();
      if (vehicleCostMap[vId]) {
        vehicleCostMap[vId].maintCost += m.cost || 0;
        vehicleCostMap[vId].totalCost += m.cost || 0;
      }
    });

    expenses.forEach(e => {
      const vId = e.vehicle?.toString();
      if (vehicleCostMap[vId]) {
        vehicleCostMap[vId].otherCost += e.total || 0;
        vehicleCostMap[vId].totalCost += e.total || 0;
      }
    });

    const topCostliestVehicles = Object.values(vehicleCostMap)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    // Monthly Revenue & Expense Trend
    const monthlyMap = {};

    trips.forEach(t => {
      const date = new Date(t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dist = t.actualDistance || t.plannedDistance || 0;
      const rev = dist * 20;

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
      monthlyMap[monthKey].revenue += rev;
    });

    const addCostToMonth = (dateObj, amount) => {
      const date = new Date(dateObj);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
      monthlyMap[monthKey].expenses += amount;
    };

    fuelLogs.forEach(f => addCostToMonth(f.createdAt, f.cost || 0));
    maintenanceLogs.forEach(m => addCostToMonth(m.createdAt, m.cost || 0));
    expenses.forEach(e => addCostToMonth(e.createdAt, e.total || 0));

    const monthlyRevenueTrend = Object.values(monthlyMap)
      .map(item => ({
        ...item,
        profit: item.revenue - item.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      role,
      title: 'Financial & ROI Analytics',
      subtitle: 'Operational expenditures, fuel efficiency, and vehicle cost trends.',
      kpis: [
        { id: 'totalOperationalCost', label: 'Operational Cost', value: Math.round(totalExpense), suffix: '$', isCurrency: true, type: 'currency', color: '#ef4444' },
        { id: 'fleetUtilizationPct', label: 'Fleet Utilization', value: fleetUtilizationPct, suffix: '%', isPercentage: true, type: 'percent', color: '#3b82f6' },
        { id: 'avgFuelEfficiency', label: 'Avg Fuel Efficiency', value: avgFuelEfficiency, suffix: ' km/L', type: 'rate', color: '#10b981' },
        { id: 'avgVehicleRoi', label: 'Avg Vehicle ROI', value: avgVehicleRoiPct, suffix: '%', isPercentage: true, type: 'percent', color: '#6366f1' }
      ],
      widgets: {
        topCostliestVehicles,
        monthlyRevenueTrend
      },
      filterOptions
    };
  }

  // Default Fallback
  return {
    role,
    title: 'Dashboard Summary',
    subtitle: 'TransitOps live fleet overview.',
    kpis: [
      { id: 'activeVehicles', label: 'Active Vehicles', value: totalVehiclesExRetired, suffix: '', color: '#6366f1' },
      { id: 'availableVehicles', label: 'Available Vehicles', value: availableVehiclesCount, suffix: '', color: '#10b981' }
    ],
    widgets: { vehicleStatusBreakdown },
    filterOptions
  };
};
