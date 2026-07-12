const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  licenseNumber: { type: String, unique: true, required: true },
  licenseCategory: { 
    type: String, 
    enum: ['LMV', 'HMV', 'MCWG', 'Heavy Trailer'], 
    required: true 
  },
  licenseExpiry: { type: Date, required: true },
  contact: { type: String, required: true },
  safetyScore: { type: Number, min: 0, max: 100, default: 100 },
  status: { 
    type: String, 
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'], 
    default: 'Available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
