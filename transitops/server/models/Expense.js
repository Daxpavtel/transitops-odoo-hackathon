const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  toll: { type: Number, default: 0, min: 0 },
  other: { type: Number, default: 0, min: 0 },
  maintenanceLinked: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
