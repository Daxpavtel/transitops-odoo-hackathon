const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // 10 requests per IP per window across ALL emails
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errors: [{ field: null, message: 'Too many login attempts from this network. Try again later.' }]
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,                     // 5 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errors: [{ field: null, message: 'Too many registration attempts from this IP. Try again later.' }]
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

module.exports = { loginLimiter, registerLimiter };
