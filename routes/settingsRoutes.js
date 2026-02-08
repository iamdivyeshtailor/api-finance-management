const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

// GET /api/settings — Get current budget settings
router.get('/', getSettings);

// PUT /api/settings — Update budget settings
router.put('/', updateSettings);

module.exports = router;
