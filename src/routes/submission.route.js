const express = require('express');
const router = express.Router();
const {
  getAllSubmissions,
  getSubmissionById,
  updateSubmission,
  getSubmissionsByTeam,
  getSubmissionFilters
} = require('../controllers/submissionController');
const requireAdmin = require('../../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin);

// GET /submissions - Get all submissions
router.get('/', getAllSubmissions);

// GET /submissions/filters - Get filter options (teams, types)
router.get('/filters', getSubmissionFilters);

// GET /submissions/team/:teamId - Get submissions by team
router.get('/team/:teamId', getSubmissionsByTeam);

// GET /submissions/:id - Get single submission by ID
router.get('/:id', getSubmissionById);

// PUT /submissions/:id - Update submission by ID
router.put('/:id', updateSubmission);

module.exports = router;