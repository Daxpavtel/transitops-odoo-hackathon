const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  licenseNumber: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true,
    set: value => {
      if (typeof value !== 'string') return value;
      const formatted = value.trim().toUpperCase();
      return /^[A-Z]{2}(?:-\d{2}|\d{2}[ -]?)\d{4}\d{7}$/.test(formatted)
        ? formatted.replace(/[ -]/g, '')
        : formatted;
    },
    match: [/^[A-Z]{2}\d{2}\d{4}\d{7}$/, 'License number must use AA00YYYY0000000 format.']
  },
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
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"],
    default: "Unknown"
  },
  emergencyContactName: {
    type: String,
    minlength: 2
  },
  emergencyContactNumber: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
