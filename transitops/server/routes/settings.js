const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(auth);

// General Settings (Any authenticated user can read)
router.get('/', settingsController.getSettings);

// RBAC Matrix (Any authenticated user can read so frontend knows what to render)
router.get('/rbac', settingsController.getRBACMatrix);

// Only FleetManager can update settings or RBAC.
// Use 'admin' string to bypass middleware standard check, 
// wait, the new checkPermission logic will handle FleetManager explicitly.
// But we'll enforce that the route requires FleetManager by using checkPermission.
// We'll pass 'settings', 'edit' to the new checkPermission.
router.put('/', authorize('settings', 'edit'), settingsController.updateSettings);
router.put('/rbac', authorize('settings', 'edit'), settingsController.updateRBACMatrix);

module.exports = router;
