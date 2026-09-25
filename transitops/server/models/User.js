const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'],
    required: true 
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastFailedLoginAt: { type: Date, default: null },
  themePreference: { type: String, enum: ['light', 'dark'], default: 'dark' }
}, { 
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.passwordHash;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
