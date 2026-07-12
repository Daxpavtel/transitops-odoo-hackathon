const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
require('dotenv').config();

const seedUsers = [
  { name: "Fleet Manager Demo",    email: "fleetmanager@transitops.io", role: "FleetManager",    password: "Password@123" },
  { name: "Dispatcher Demo",       email: "dispatcher@transitops.io",   role: "Dispatcher",       password: "Password@123" },
  { name: "Safety Officer Demo",   email: "safety@transitops.io",       role: "SafetyOfficer",    password: "Password@123" },
  { name: "Financial Analyst Demo", email: "finance@transitops.io",     role: "FinancialAnalyst", password: "Password@123" }
];

const seedVehicles = [
  { registrationNumber: "MH12QW1234", name: "Tata Ace Gold", type: "Mini", maxLoadCapacity: 850, odometer: 42000, acquisitionCost: 6500, status: "Available" },
  { registrationNumber: "DL01AB9999", name: "Mahindra Scorpio Pick-up", type: "Van", maxLoadCapacity: 1200, odometer: 15200, acquisitionCost: 14000, status: "On Trip" },
  { registrationNumber: "KA03XY4567", name: "Eicher Pro 2049", type: "Truck", maxLoadCapacity: 3500, odometer: 89000, acquisitionCost: 28000, status: "In Shop" },
  { registrationNumber: "HR55ZZ0001", name: "BharatBenz 1917R", type: "Truck", maxLoadCapacity: 10500, odometer: 150000, acquisitionCost: 45000, status: "Retired" }
];

const today = new Date();
const next15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
const next60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
const pastDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

const seedDrivers = [
  { name: "Rajesh Kumar", licenseNumber: "DL1420110012345", licenseCategory: "HMV", licenseExpiry: next60Days, contact: "9876543210", safetyScore: 95, status: "Available" },
  { name: "Amit Sharma", licenseNumber: "MH1220150098765", licenseCategory: "LMV", licenseExpiry: next15Days, contact: "8765432109", safetyScore: 88, status: "On Trip" },
  { name: "Vikram Singh", licenseNumber: "KA0320100045678", licenseCategory: "Heavy Trailer", licenseExpiry: pastDate, contact: "7654321098", safetyScore: 72, status: "Suspended" },
  { name: "Suresh Raina", licenseNumber: "HR5520180011223", licenseCategory: "MCWG", licenseExpiry: next60Days, contact: "6543210987", safetyScore: 91, status: "Off Duty" }
];

const seedDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding all tables.');

    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});

    // Seed Users
    for (const userData of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);
      await User.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        passwordHash,
        failedLoginAttempts: 0,
        lockUntil: null
      });
    }
    console.log('Users seeded.');

    // Seed Vehicles
    await Vehicle.insertMany(seedVehicles);
    console.log('Vehicles seeded.');

    // Seed Drivers
    await Driver.insertMany(seedDrivers);
    console.log('Drivers seeded.');

    console.log('\nSeed successful!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
