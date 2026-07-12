const Settings = require('../models/Settings');

const authorize = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, errors: [{ field: null, message: 'Not authenticated' }] });
      }

      const role = req.user.role;

      // FleetManager bypasses all checks
      if (role === 'FleetManager') {
        return next();
      }

      // Fetch global settings
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({});
      }

      const matrix = settings.rbacMatrix.get(role);
      
      if (!matrix) {
        return res.status(403).json({ success: false, errors: [{ field: 'role', message: 'Role not found in RBAC matrix' }] });
      }

      if (matrix[permissionKey] !== true) {
        return res.status(403).json({ success: false, errors: [{ field: 'permission', message: `Forbidden: Missing ${permissionKey} permission.` }] });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authorize };
