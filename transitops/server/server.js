const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, errors: [{ message: 'Too many requests from this IP, please try again later.' }] },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const fuelRoutes = require('./routes/fuel');
const expenseRoutes = require('./routes/expenses');
const financeRoutes = require('./routes/finance');
const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let field = err.field || null;

  // Handle specific MongoDB errors without leaking stack traces
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }
  
  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate field value entered';
    field = Object.keys(err.keyValue)[0];
  }

  if (process.env.NODE_ENV !== 'development' && status === 500) {
    message = 'Something went wrong'; // Mask internals in prod
  }

  // Ensure no stack traces in response
  res.status(status).json({
    success: false,
    errors: [{ field, message }]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
