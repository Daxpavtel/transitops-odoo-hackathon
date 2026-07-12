const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'], 
    required: true,
    unique: true
  },
  permissions: {
    fleet: { type: String, enum: ['edit', 'view', 'hidden'], default: 'hidden' },
    drivers: { type: String, enum: ['edit', 'view', 'hidden'], default: 'hidden' },
    trips: { type: String, enum: ['edit', 'view', 'hidden'], default: 'hidden' },
    fuelExpenses: { type: String, enum: ['edit', 'view', 'hidden'], default: 'hidden' },
    analytics: { type: String, enum: ['edit', 'view', 'hidden'], default: 'hidden' }
  }
}, { timestamps: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
