const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = [
  { name: "Fleet Manager Demo",    email: "fleetmanager@transitops.io", role: "FleetManager",    password: "Password@123" },
  { name: "Dispatcher Demo",       email: "dispatcher@transitops.io",   role: "Dispatcher",       password: "Password@123" },
  { name: "Safety Officer Demo",   email: "safety@transitops.io",       role: "SafetyOfficer",    password: "Password@123" },
  { name: "Financial Analyst Demo", email: "finance@transitops.io",     role: "FinancialAnalyst", password: "Password@123" }
];

const seedDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding.');

    await User.deleteMany({}); // Clear existing users

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

    console.log('\n--- Seed Users Created ---');
    seedUsers.forEach(u => {
      console.log(`Role: ${u.role}\nEmail: ${u.email}\nPassword: ${u.password}\n`);
    });
    console.log('--------------------------\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
