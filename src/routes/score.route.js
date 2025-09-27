const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const requireAdmin = require('../../middleware/requireAdmin');

/**
 * @route   POST /scores
 * @desc    Add or update score for a team in a specific review round
 * @access  Admin only
 */
router.post('/', requireAdmin, scoreController.addOrUpdateScore);

/**
 * @route   GET /scores
 * @desc    Get all scores for all teams
 * @access  Admin only
 */
router.get('/', requireAdmin, scoreController.getAllScores);

/**
 * @route   GET /scores/team/:teamId
 * @desc    Get scores for a specific team
 * @access  Admin only
 */
router.get('/team/:teamId', requireAdmin, scoreController.getTeamScores);

/**
 * @route   GET /scores/leaderboard
 * @desc    Get leaderboard (teams sorted by total score)
 * @access  Admin only
 */
router.get('/leaderboard', requireAdmin, scoreController.getLeaderboard);

/**
 * @route   DELETE /scores/:id
 * @desc    Delete a score entry
 * @access  Admin only
 */
router.delete('/:id', requireAdmin, scoreController.deleteScore);

module.exports = router;