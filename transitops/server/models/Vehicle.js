const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, unique: true, required: true },
  name: { type: String, required: true, minlength: 2 },
  type: { 
    type: String, 
    enum: ['Van', 'Truck', 'Mini'], 
    required: true 
  },
  maxLoadCapacity: { type: Number, required: true, min: [1, 'Capacity must be greater than 0'] },
  odometer: { type: Number, default: 0, min: 0 },
  acquisitionCost: { type: Number, required: true, min: [1, 'Cost must be greater than 0'] },
  status: { 
    type: String, 
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'], 
    default: 'Available'
  }
}, { timestamps: true });

// Case insensitive unique index for registrationNumber
vehicleSchema.index({ registrationNumber: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Vehicle', vehicleSchema);
