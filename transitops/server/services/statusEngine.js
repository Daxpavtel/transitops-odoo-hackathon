const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');

class AppError extends Error {
  constructor(statusCode, message, field = null) {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
  }
}

const statusEngine = {
  async dispatchTrip(tripId) {
    const trip = await Trip.findById(tripId).populate('vehicle').populate('driver');
    if (!trip) throw new AppError(404, 'Trip not found');

    if (trip.status !== 'Draft') {
      throw new AppError(422, `Invalid status transition: Cannot dispatch a trip in ${trip.status} status.`);
    }

    const { vehicle, driver, cargoWeight } = trip;

    if (vehicle.status !== 'Available') {
      throw new AppError(409, `Vehicle is not Available (current status: ${vehicle.status}).`, 'vehicle');
    }

    if (driver.status !== 'Available') {
      throw new AppError(409, `Driver is not Available (current status: ${driver.status}).`, 'driver');
    }

    if (driver.status === 'Suspended' || new Date(driver.licenseExpiry) < new Date()) {
      throw new AppError(403, 'Expired license or Suspended status → blocked from trip assignment', 'driver');
    }

    if (cargoWeight > vehicle.maxLoadCapacity) {
      const over = cargoWeight - vehicle.maxLoadCapacity;
      throw new AppError(400, `Vehicle Capacity ${vehicle.maxLoadCapacity} kg / Cargo Weight ${cargoWeight} kg — Capacity exceeded by ${over} kg → dispatch blocked`, 'cargoWeight');
    }

    // Transition state
    trip.status = 'Dispatched';
    await trip.save();

    vehicle.status = 'On Trip';
    await vehicle.save();

    driver.status = 'On Trip';
    await driver.save();

    return trip;
  },

  async completeTrip(tripId, actualDistance, fuelConsumed) {
    const trip = await Trip.findById(tripId).populate('vehicle');
    if (!trip) throw new AppError(404, 'Trip not found');

    if (trip.status !== 'Dispatched') {
      throw new AppError(422, `Invalid status transition: Only Dispatched trips can be completed.`);
    }

    if (!actualDistance || actualDistance <= 0) {
      throw new AppError(400, 'actualDistance must be > 0', 'actualDistance');
    }
    if (!fuelConsumed || fuelConsumed <= 0) {
      throw new AppError(400, 'fuelConsumed must be > 0', 'fuelConsumed');
    }

    const vehicle = trip.vehicle;
    const driver = await Driver.findById(trip.driver);

    // Update trip details
    trip.actualDistance = actualDistance;
    trip.fuelConsumed = fuelConsumed;
    trip.status = 'Completed';
    await trip.save();

    // Generate FuelLog
    // Mock fuel cost calculation for now, e.g., 100 per liter
    const fuelCost = fuelConsumed * 100; 
    await FuelLog.create({
      vehicle: vehicle._id,
      liters: fuelConsumed,
      cost: fuelCost,
      date: new Date()
    });

    // Create Base Expense
    await Expense.create({
      trip: trip._id,
      vehicle: vehicle._id,
      toll: 0,
      other: 0,
      total: 0 // Excludes fuel directly, total is sum(toll+other+maintenanceLinked)
    });

    // Update Vehicle
    vehicle.odometer += actualDistance;
    vehicle.status = 'Available';
    await vehicle.save();

    // Update Driver
    driver.status = 'Available';
    await driver.save();

    return trip;
  },

  async cancelTrip(tripId, cancellationReason = '') {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError(404, 'Trip not found');

    if (trip.status !== 'Dispatched') {
      throw new AppError(422, `Invalid status transition: Only Dispatched trips can be cancelled.`);
    }

    trip.status = 'Cancelled';
    trip.cancellationReason = cancellationReason;
    await trip.save();

    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
    await Driver.findByIdAndUpdate(trip.driver, { status: 'Available' });

    return trip;
  }
};

module.exports = statusEngine;
