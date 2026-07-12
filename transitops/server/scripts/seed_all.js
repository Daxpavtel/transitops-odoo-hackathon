const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const Expense = require('../models/Expense');
require('dotenv').config();

const seedUsers = [
  { name: "Fleet Manager Demo",    email: "fleetmanager@transitops.io", role: "FleetManager",    password: "Password@123" },
  { name: "Dispatcher Demo",       email: "dispatcher@transitops.io",   role: "Dispatcher",       password: "Password@123" },
  { name: "Safety Officer Demo",   email: "safety@transitops.io",       role: "SafetyOfficer",    password: "Password@123" },
  { name: "Financial Analyst Demo", email: "finance@transitops.io",     role: "FinancialAnalyst", password: "Password@123" }
];

const seedVehicles = [
  { registrationNumber: "MH12QW1234", name: "Tata Ace Gold", type: "Mini", maxLoadCapacity: 850, odometer: 42000, acquisitionCost: 6500, status: "Available" },
  { registrationNumber: "DL01AB9999", name: "Mahindra Scorpio Pick-up", type: "Van", maxLoadCapacity: 1200, odometer: 15200, acquisitionCost: 14000, status: "Available" },
  { registrationNumber: "KA03XY4567", name: "Eicher Pro 2049", type: "Truck", maxLoadCapacity: 3500, odometer: 89000, acquisitionCost: 28000, status: "In Shop" },
  { registrationNumber: "HR55ZZ0001", name: "BharatBenz 1917R", type: "Truck", maxLoadCapacity: 10500, odometer: 150000, acquisitionCost: 45000, status: "Retired" }
];

const today = new Date();
const next15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
const next60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
const pastDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

const seedDrivers = [
  { name: "Rajesh Kumar", licenseNumber: "DL1420110012345", licenseCategory: "HMV", licenseExpiry: next60Days, contact: "9876543210", safetyScore: 95, status: "Available", bloodGroup: "O+", emergencyContactName: "Priya Kumar", emergencyContactNumber: "9123456780" },
  { name: "Amit Sharma", licenseNumber: "MH1220150098765", licenseCategory: "LMV", licenseExpiry: next15Days, contact: "8765432109", safetyScore: 88, status: "Available", bloodGroup: "B+", emergencyContactName: "Sunita Sharma", emergencyContactNumber: "9876123450" },
  { name: "Vikram Singh", licenseNumber: "KA0320100045678", licenseCategory: "Heavy Trailer", licenseExpiry: pastDate, contact: "7654321098", safetyScore: 72, status: "Suspended", bloodGroup: "A-", emergencyContactName: "Anjali Singh", emergencyContactNumber: "9988776655" },
  { name: "Suresh Raina", licenseNumber: "HR5520180011223", licenseCategory: "MCWG", licenseExpiry: next60Days, contact: "6543210987", safetyScore: 91, status: "Off Duty", bloodGroup: "AB+", emergencyContactName: "Ramesh Raina", emergencyContactNumber: "9876543210" }
];

const seedDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding all tables.');

    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await FuelLog.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await Expense.deleteMany({});

    // Seed Users
    const users = [];
    for (const userData of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        passwordHash,
        failedLoginAttempts: 0,
        lockUntil: null
      });
      users.push(user);
    }
    console.log('Users seeded.');

    // Seed Vehicles
    const vehicles = await Vehicle.insertMany(seedVehicles);
    console.log('Vehicles seeded.');

    // Seed Drivers
    const drivers = await Driver.insertMany(seedDrivers);
    console.log('Drivers seeded.');

    const manager = users.find(u => u.role === 'FleetManager') || users[0];

    // Seed Trips, FuelLogs, and Expenses across recent months for trend display
    const tripData = [
      {
        tripCode: "TR001",
        source: "Mumbai",
        destination: "Pune",
        vehicle: vehicles[0]._id,
        driver: drivers[0]._id,
        cargoWeight: 500,
        plannedDistance: 150,
        actualDistance: 155,
        fuelConsumed: 22,
        status: "Completed",
        createdBy: manager._id,
        createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 5)
      },
      {
        tripCode: "TR002",
        source: "Delhi",
        destination: "Noida",
        vehicle: vehicles[1]._id,
        driver: drivers[1]._id,
        cargoWeight: 900,
        plannedDistance: 80,
        actualDistance: 82,
        fuelConsumed: 12,
        status: "Completed",
        createdBy: manager._id,
        createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 10)
      },
      {
        tripCode: "TR003",
        source: "Bangalore",
        destination: "Chennai",
        vehicle: vehicles[2]._id,
        driver: drivers[0]._id,
        cargoWeight: 2000,
        plannedDistance: 350,
        actualDistance: 360,
        fuelConsumed: 60,
        status: "Completed",
        createdBy: manager._id,
        createdAt: new Date(today.getFullYear(), today.getMonth(), 1)
      },
      {
        tripCode: "TR004",
        source: "Delhi",
        destination: "Jaipur",
        vehicle: vehicles[0]._id,
        driver: drivers[1]._id,
        cargoWeight: 750,
        plannedDistance: 270,
        actualDistance: 275,
        fuelConsumed: 40,
        status: "Completed",
        createdBy: manager._id,
        createdAt: new Date(today.getFullYear(), today.getMonth(), 8)
      }
    ];

    const seededTrips = await Trip.insertMany(tripData);
    console.log('Trips seeded.');

    // Seed Fuel Logs
    const fuelLogs = [
      {
        vehicle: vehicles[0]._id,
        liters: 22,
        cost: 22 * 100, // $100 per liter
        date: new Date(today.getFullYear(), today.getMonth() - 2, 5),
        createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 5)
      },
      {
        vehicle: vehicles[1]._id,
        liters: 12,
        cost: 12 * 100,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 10),
        createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 10)
      },
      {
        vehicle: vehicles[2]._id,
        liters: 60,
        cost: 60 * 100,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        createdAt: new Date(today.getFullYear(), today.getMonth(), 1)
      },
      {
        vehicle: vehicles[0]._id,
        liters: 40,
        cost: 40 * 100,
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        createdAt: new Date(today.getFullYear(), today.getMonth(), 8)
      }
    ];
    await FuelLog.insertMany(fuelLogs);
    console.log('Fuel logs seeded.');

    // Seed Expenses
    const expenses = [
      {
        trip: seededTrips[0]._id,
        vehicle: vehicles[0]._id,
        toll: 150,
        other: 50,
        maintenanceLinked: 0,
        total: 200,
        createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 5)
      },
      {
        trip: seededTrips[1]._id,
        vehicle: vehicles[1]._id,
        toll: 80,
        other: 40,
        maintenanceLinked: 0,
        total: 120,
        createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 10)
      },
      {
        trip: seededTrips[2]._id,
        vehicle: vehicles[2]._id,
        toll: 300,
        other: 100,
        maintenanceLinked: 0,
        total: 400,
        createdAt: new Date(today.getFullYear(), today.getMonth(), 1)
      },
      {
        trip: seededTrips[3]._id,
        vehicle: vehicles[0]._id,
        toll: 250,
        other: 50,
        maintenanceLinked: 0,
        total: 300,
        createdAt: new Date(today.getFullYear(), today.getMonth(), 8)
      }
    ];
    await Expense.insertMany(expenses);
    console.log('Expenses seeded.');

    // Seed active maintenance log
    const inShopVehicle = vehicles.find(v => v.registrationNumber === 'KA03XY4567');
    if (inShopVehicle) {
      await MaintenanceLog.create({
        vehicle: inShopVehicle._id,
        serviceType: "Engine Overhaul",
        cost: 1200,
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: "Active",
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      });
      console.log('Active maintenance log seeded for In Shop vehicle.');
    }

    console.log('Seeding RBAC Matrix...');
    const RolePermission = require('../models/RolePermission');
    await RolePermission.deleteMany({});
    const matrix = [
      { role: "FleetManager", permissions: { fleet: "edit", drivers: "edit", trips: "hidden", fuelExpenses: "hidden", analytics: "hidden" } },
      { role: "Dispatcher", permissions: { fleet: "view", drivers: "hidden", trips: "edit", fuelExpenses: "edit", analytics: "edit" } },
      { role: "SafetyOfficer", permissions: { fleet: "hidden", drivers: "view", trips: "hidden", fuelExpenses: "hidden", analytics: "hidden" } },
      { role: "FinancialAnalyst", permissions: { fleet: "view", drivers: "hidden", trips: "hidden", fuelExpenses: "view", analytics: "edit" } }
    ];
    await RolePermission.insertMany(matrix);

    console.log('\nSeed successful!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
