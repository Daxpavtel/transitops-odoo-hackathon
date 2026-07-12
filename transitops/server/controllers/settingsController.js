const Settings = require('../models/Settings');
const RolePermission = require('../models/RolePermission');

// GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { depotName, currency, distanceUnit } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    if (depotName !== undefined) settings.depotName = depotName;
    if (currency !== undefined) settings.currency = currency;
    if (distanceUnit !== undefined) settings.distanceUnit = distanceUnit;

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/rbac
exports.getRBACMatrix = async (req, res, next) => {
  try {
    const matrix = await RolePermission.find();
    res.json({ success: true, data: matrix });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/rbac
exports.updateRBACMatrix = async (req, res, next) => {
  try {
    // Expecting req.body.matrix to be an array of RolePermission objects
    const { matrix } = req.body;
    
    if (!Array.isArray(matrix)) {
      return res.status(400).json({ success: false, errors: [{ field: 'matrix', message: 'Matrix must be an array' }] });
    }

    // Update each role's permissions
    const updated = await Promise.all(
      matrix.map(async (item) => {
        const { role, permissions } = item;
        return RolePermission.findOneAndUpdate(
          { role },
          { permissions },
          { new: true, upsert: true }
        );
      })
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
