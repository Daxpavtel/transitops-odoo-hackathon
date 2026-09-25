const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.cookies?.token || req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, errors: [{ field: null, message: 'No token, authorization denied' }] });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_long_random_string');
    
    // Check if user still exists and get latest role
    const currentUser = await User.findById(decoded.id).select('role');
    if (!currentUser) return res.status(401).json({ success: false, errors: [{ message: 'User no longer exists' }] });
    
    req.user = decoded; // Contains id and role from JWT
    req.user.role = currentUser.role; // overwrite JWT-derived value with live DB value
    
    next();
  } catch (err) {
    res.status(401).json({ success: false, errors: [{ field: null, message: 'Token is not valid' }] });
  }
};
