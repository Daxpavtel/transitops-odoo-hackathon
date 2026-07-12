const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'TransitOps Default' },
  currency: { type: String, default: 'INR' },
  rbacMatrix: {
    type: Map,
    of: {
      canManageVehicles: { type: Boolean, default: false },
      canManageDrivers: { type: Boolean, default: false },
      canDispatchTrips: { type: Boolean, default: false },
      canManageMaintenance: { type: Boolean, default: false },
      canManageFuelExpenses: { type: Boolean, default: false },
      canViewDashboard: { type: Boolean, default: false }
    },
    default: {
      'Dispatcher': {
        canManageVehicles: false,
        canManageDrivers: true,
        canDispatchTrips: true,
        canManageMaintenance: false,
        canManageFuelExpenses: false,
        canViewDashboard: true
      },
      'SafetyOfficer': {
        canManageVehicles: true,
        canManageDrivers: true,
        canDispatchTrips: false,
        canManageMaintenance: true,
        canManageFuelExpenses: false,
        canViewDashboard: true
      },
      'FinancialAnalyst': {
        canManageVehicles: false,
        canManageDrivers: false,
        canDispatchTrips: false,
        canManageMaintenance: false,
        canManageFuelExpenses: true,
        canViewDashboard: true
      }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
