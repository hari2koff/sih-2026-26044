/**
 * =============================================================================
 * SkillBridge Internship & Industry Openings Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getInternships,
  getInternshipById,
  applyInternship
} = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInternships);
router.get('/:id', protect, getInternshipById);
router.post('/:id/apply', protect, applyInternship);

module.exports = router;
