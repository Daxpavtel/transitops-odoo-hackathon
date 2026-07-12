const Settings = require('../models/Settings');

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

exports.updateSettings = async (req, res, next) => {
  try {
    const { companyName, currency, rbacMatrix } = req.body;
    
    // Only FleetManager can update
    if (req.user.role !== 'FleetManager') {
      return res.status(403).json({ success: false, errors: [{ field: 'role', message: 'Forbidden: Only FleetManager can update settings.' }] });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (companyName) settings.companyName = companyName;
    if (currency) settings.currency = currency;
    if (rbacMatrix) {
      // Loop over roles and merge to avoid wiping out schema
      for (const role in rbacMatrix) {
        if (settings.rbacMatrix.has(role)) {
          settings.rbacMatrix.set(role, { ...settings.rbacMatrix.get(role), ...rbacMatrix[role] });
        }
      }
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
