const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const userController = require('../controllers/userController');

// admin-only endpoints
router.post('/ban', requireAdmin, userController.banUser);
router.post('/unban', requireAdmin, userController.unbanUser);
router.get('/:userId/status', requireAdmin, userController.getUserStatus);

module.exports = router;