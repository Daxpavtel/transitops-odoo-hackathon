const rateLimit = require('express-rate-limit');

// Rate limiters disabled for testing
const noopLimiter = (req, res, next) => next();

module.exports = { 
  loginLimiter: noopLimiter, 
  registerLimiter: noopLimiter 
};
