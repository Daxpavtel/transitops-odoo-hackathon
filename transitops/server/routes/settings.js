const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.get('/', auth, settingsController.getSettings);
router.put('/', auth, settingsController.updateSettings);

module.exports = router;
