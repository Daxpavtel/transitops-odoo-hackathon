const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, errors: [{ field: null, message: 'No token, authorization denied' }] });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_long_random_string');
    req.user = decoded; // Contains id and role
    next();
  } catch (err) {
    res.status(401).json({ success: false, errors: [{ field: null, message: 'Token is not valid' }] });
  }
};
