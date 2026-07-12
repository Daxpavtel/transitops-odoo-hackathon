const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // 10 failed requests per account/network per window
  skipSuccessfulRequests: true,
  // Shared networks are common in offices and local testing. Scope the limiter to
  // the account as well as the network so one user's attempts cannot lock out
  // every other role on the same IP address.
  keyGenerator: (req) => `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errors: [{ field: null, message: 'Too many unsuccessful login attempts for this account. Try again later.' }]
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
