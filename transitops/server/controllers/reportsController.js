const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const Expense = require('../models/Expense');

// Role check helper
const checkRole = (role) => ['FinancialAnalyst', 'FleetManager'].includes(role);

// Helper to format validation and rule failures
const formatError = (message, field = null) => ({
  success: false,
  errors: [{ field, message }]
});

// GET /api/reports/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Date filters for queries
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // Set to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // --- AGGREGATIONS ---

    // 1. Trips for Revenue and Efficiency
    const trips = await Trip.find({
      status: { $in: ['Completed', 'Dispatched'] },
      ...dateFilter
    });

    let totalRevenue = 0;
    let totalDistance = 0;
    let totalFuel = 0;

    trips.forEach(trip => {
      const dist = trip.actualDistance || trip.plannedDistance || 0;
      totalRevenue += dist * 20; // Revenue formula: $20 per km
      totalDistance += dist;
      totalFuel += trip.fuelConsumed || 0;
    });

    // 2. Expenses from Expense model (tolls, other, maintenanceLinked)
    const expenses = await Expense.find(dateFilter);
    let totalExpenseModel = 0;
    expenses.forEach(e => {
      totalExpenseModel += e.total || 0;
    });

    // 3. Fuel Logs costs
    const fuelLogs = await FuelLog.find(dateFilter);
    let totalFuelCost = 0;
    fuelLogs.forEach(f => {
      totalFuelCost += f.cost || 0;
    });

    // 4. Maintenance Logs costs
    const maintenanceLogs = await MaintenanceLog.find(dateFilter);
    let totalMaintCost = 0;
    maintenanceLogs.forEach(m => {
      totalMaintCost += m.cost || 0;
    });

    const totalExpense = totalExpenseModel + totalFuelCost + totalMaintCost;
    const netProfit = totalRevenue - totalExpense;

    // Fleet Avg Efficiency (Fuel / Distance)
    const fleetAvgEfficiency = totalDistance > 0 ? parseFloat((totalFuel / totalDistance).toFixed(2)) : 0;

    // --- Monthly Revenue & Profit Pipeline ---
    // Group trips & expenses by month
    const monthlyDataMap = {};

    // Process Revenue monthly
    trips.forEach(trip => {
      const date = new Date(trip.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dist = trip.actualDistance || trip.plannedDistance || 0;
      const rev = dist * 20;

      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
      }
      monthlyDataMap[monthKey].revenue += rev;
    });

    // Process Expenses monthly (combining all categories)
    const addExpenseToMonth = (createdAt, amt) => {
      const date = new Date(createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
      }
      monthlyDataMap[monthKey].expenses += amt;
    };

    expenses.forEach(e => addExpenseToMonth(e.createdAt, e.total || 0));
    fuelLogs.forEach(f => addExpenseToMonth(f.createdAt, f.cost || 0));
    maintenanceLogs.forEach(m => addExpenseToMonth(m.createdAt, m.cost || 0));

    // Convert monthly map to sorted array
    const monthlyPipeline = Object.values(monthlyDataMap)
      .map(item => ({
        ...item,
        profit: item.revenue - item.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // --- Vehicle ROI Pipeline ---
    const allVehicles = await Vehicle.find();
    const vehicleDataMap = {};

    allVehicles.forEach(v => {
      vehicleDataMap[v._id.toString()] = {
        id: v._id.toString(),
        registrationNumber: v.registrationNumber,
        name: v.name,
        revenue: 0,
        expense: 0
      };
    });

    // Populate revenue per vehicle
    trips.forEach(trip => {
      const vId = trip.vehicle?.toString();
      if (vehicleDataMap[vId]) {
        const dist = trip.actualDistance || trip.plannedDistance || 0;
        vehicleDataMap[vId].revenue += dist * 20;
      }
    });

    // Populate expenses per vehicle
    expenses.forEach(e => {
      const vId = e.vehicle?.toString();
      if (vehicleDataMap[vId]) {
        vehicleDataMap[vId].expense += e.total || 0;
      }
    });
    fuelLogs.forEach(f => {
      const vId = f.vehicle?.toString();
      if (vehicleDataMap[vId]) {
        vehicleDataMap[vId].expense += f.cost || 0;
      }
    });
    maintenanceLogs.forEach(m => {
      const vId = m.vehicle?.toString();
      if (vehicleDataMap[vId]) {
        vehicleDataMap[vId].expense += m.cost || 0;
      }
    });

    // Compute ROI and format
    const vehiclePipeline = Object.values(vehicleDataMap).map(item => {
      const roi = item.expense > 0 ? (item.revenue - item.expense) / item.expense : 0;
      return {
        ...item,
        roi: parseFloat(roi.toFixed(2))
      };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalExpense,
          netProfit,
          fleetAvgEfficiency
        },
        monthlyPipeline,
        vehiclePipeline
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/export
exports.exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const vehicles = await Vehicle.find();
    const trips = await Trip.find({ status: { $in: ['Completed', 'Dispatched'] }, ...dateFilter });
    const expenses = await Expense.find(dateFilter);
    const fuelLogs = await FuelLog.find(dateFilter);
    const maintenanceLogs = await MaintenanceLog.find(dateFilter);

    const vehicleDataMap = {};
    vehicles.forEach(v => {
      vehicleDataMap[v._id.toString()] = {
        registrationNumber: v.registrationNumber,
        name: v.name,
        revenue: 0,
        expense: 0
      };
    });

    trips.forEach(trip => {
      const vId = trip.vehicle?.toString();
      if (vehicleDataMap[vId]) {
        const dist = trip.actualDistance || trip.plannedDistance || 0;
        vehicleDataMap[vId].revenue += dist * 20;
      }
    });

    expenses.forEach(e => {
      const vId = e.vehicle?.toString();
      if (vehicleDataMap[vId]) vehicleDataMap[vId].expense += e.total || 0;
    });
    fuelLogs.forEach(f => {
      const vId = f.vehicle?.toString();
      if (vehicleDataMap[vId]) vehicleDataMap[vId].expense += f.cost || 0;
    });
    maintenanceLogs.forEach(m => {
      const vId = m.vehicle?.toString();
      if (vehicleDataMap[vId]) vehicleDataMap[vId].expense += m.cost || 0;
    });

    // Build CSV Content
    let csv = 'Registration Number,Vehicle Name,Total Revenue,Total Expense,ROI\n';
    Object.values(vehicleDataMap).forEach(item => {
      const roi = item.expense > 0 ? (item.revenue - item.expense) / item.expense : 0;
      csv += `"${item.registrationNumber}","${item.name}",${item.revenue.toFixed(2)},${item.expense.toFixed(2)},${roi.toFixed(2)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle_roi_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
