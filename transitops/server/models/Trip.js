const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripCode: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true, min: 1 },
  plannedDistance: { type: Number, required: true, min: 1 },
  actualDistance: { type: Number, min: 1 },
  fuelConsumed: { type: Number, min: 1 },
  status: { 
    type: String, 
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft' 
  },
  cancellationReason: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
