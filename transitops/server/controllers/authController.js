const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

class AppError extends Error {
  constructor(statusCode, message, field = null) {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
  }
}

const signJwt = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'replace_with_a_long_random_string',
    { expiresIn: '1d' }
  );
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      throw new AppError(400, 'All fields are required');
    }

    if (name.trim().length < 2 || !/^[A-Za-z\s]+$/.test(name.trim())) {
      throw new AppError(400, 'Name must be at least 2 characters and contain only letters and spaces', 'name');
    }

    if (password !== confirmPassword) {
      throw new AppError(400, 'Passwords do not match', 'confirmPassword');
    }

    if (role === 'FleetManager') {
      throw new AppError(403, 'Registration as FleetManager is not permitted via public endpoint', 'role');
    }

    const validRoles = ['Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'];
    if (!validRoles.includes(role)) {
      throw new AppError(400, 'Invalid role selected', 'role');
    }

    // Password strength checks
    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters long', 'password');
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw new AppError(400, 'Password must contain at least 1 letter, 1 number, and 1 special character', 'password');
    }

    const blocklist = ['password123', '12345678', 'qwerty', 'password'];
    if (blocklist.includes(password.toLowerCase())) {
      throw new AppError(400, 'Password is too common', 'password');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new AppError(409, 'Email is already registered', 'email');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role
    });

    await newUser.save();
    res.status(201).json({ success: true, message: 'Registration successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minsLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new AppError(423, `Account locked after 5 failed attempts. Try again in ${minsLeft} minute(s).`);
    }

    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      user.lastFailedLoginAt = new Date();

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await user.save();
        throw new AppError(423, 'Account locked after 5 failed attempts. Try again in 15 minutes.');
      }

      await user.save();
      const remaining = MAX_ATTEMPTS - user.failedLoginAttempts;
      throw new AppError(401, `Invalid credentials. ${remaining} attempt(s) remaining.`);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = signJwt(user);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    };
    res.cookie('token', token, cookieOptions);
    res.json({ success: true, data: { user: sanitizeUser(user) } });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ success: true, data: { user: sanitizeUser(user) } });
  } catch (error) {
    next(error);
  }
};
