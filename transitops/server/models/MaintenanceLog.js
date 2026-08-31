const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  serviceType: { type: String, required: true },
  cost: {
    type: Number,
    required: true,
    min: [0, 'Maintenance cost cannot be negative.'],
    validate: {
      validator: Number.isFinite,
      message: 'Maintenance cost must be a finite number.'
    }
  },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
