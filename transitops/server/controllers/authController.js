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
    res.json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (error) {
    next(error);
  }
};
