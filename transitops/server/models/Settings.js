const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  depotName: { type: String, default: 'TransitOps Default' },
  currency: { type: String, default: 'INR' },
  distanceUnit: { type: String, enum: ['km', 'miles'], default: 'km' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
