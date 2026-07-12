require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing old data...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});

    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    const users = [
      { name: "Fleet Manager Demo", email: "fleetmanager@transitops.io", role: "FleetManager", passwordHash },
      { name: "Dispatcher Demo", email: "dispatcher@transitops.io", role: "Dispatcher", passwordHash },
      { name: "Safety Officer Demo", email: "safety@transitops.io", role: "SafetyOfficer", passwordHash },
      { name: "Financial Analyst Demo", email: "finance@transitops.io", role: "FinancialAnalyst", passwordHash }
    ];

    await User.insertMany(users);

    console.log('Seeding Vehicles...');
    const vehicles = [
      { registrationNumber: 'MH04AB1234', name: 'Alpha Truck', type: 'Truck', maxLoadCapacity: 5000, odometer: 12000, acquisitionCost: 1500000, status: 'Available' },
      { registrationNumber: 'KA01XY9876', name: 'Beta Van', type: 'Van', maxLoadCapacity: 1500, odometer: 45000, acquisitionCost: 800000, status: 'Available' },
      { registrationNumber: 'DL09ZZ5555', name: 'Gamma Mini', type: 'Mini', maxLoadCapacity: 800, odometer: 8000, acquisitionCost: 500000, status: 'In Shop' },
      { registrationNumber: 'TN02CC3333', name: 'Delta Truck', type: 'Truck', maxLoadCapacity: 10000, odometer: 210000, acquisitionCost: 2200000, status: 'Retired' }
    ];
    await Vehicle.insertMany(vehicles);

    console.log('Seeding Drivers...');
    const drivers = [
      { name: 'Ramesh Kumar', licenseNumber: 'LIC-MH-123', licenseCategory: 'HMV', licenseExpiry: new Date(Date.now() + 31536000000), contact: '9876543210', status: 'Available' },
      { name: 'Suresh Singh', licenseNumber: 'LIC-KA-456', licenseCategory: 'LMV', licenseExpiry: new Date(Date.now() + 31536000000), contact: '9876543211', status: 'Available' },
      { name: 'Abdul Rahman', licenseNumber: 'LIC-DL-789', licenseCategory: 'Heavy Trailer', licenseExpiry: new Date(Date.now() - 86400000), contact: '9876543212', status: 'Suspended' }
    ];
    await Driver.insertMany(drivers);

    console.log('----------------------------------------------------');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Demo credentials:');
    users.forEach(u => {
      console.log(`Role: ${u.role}`);
      console.log(`Email: ${u.email}`);
      console.log(`Password: Password@123`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
