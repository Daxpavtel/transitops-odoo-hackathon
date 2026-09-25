const RolePermission = require('../models/RolePermission');

const authorize = (moduleName, requiredLevel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, errors: [{ field: null, message: 'Not authenticated' }] });
      }

      const role = req.user.role;

      // Settings module is exclusive to FleetManager
      if (moduleName === 'settings') {
        if (role === 'FleetManager') return next();
        else return res.status(403).json({ success: false, errors: [{ field: 'permission', message: 'Forbidden: Only Fleet Manager can access settings' }] });
      }

      // For all other modules, strictly use the RolePermission matrix
      const rp = await RolePermission.findOne({ role });
      
      if (!rp) {
        return res.status(403).json({ success: false, errors: [{ field: 'role', message: 'Role permissions not found in RBAC matrix' }] });
      }

      const userLevel = rp.permissions[moduleName];

      if (!userLevel || userLevel === 'hidden') {
        return res.status(403).json({ success: false, errors: [{ field: 'permission', message: `Forbidden: No access to ${moduleName}` }] });
      }

      // If require 'edit', user must have 'edit'
      if (requiredLevel === 'edit' && userLevel !== 'edit') {
        return res.status(403).json({ success: false, errors: [{ field: 'permission', message: `Forbidden: Read-only access to ${moduleName}` }] });
      }

      // If require 'view', user can have 'view' or 'edit'
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authorize };
