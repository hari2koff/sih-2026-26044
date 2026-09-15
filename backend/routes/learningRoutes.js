/**
 * =============================================================================
 * SkillBridge Learning Roadmaps & Virtual Sandbox Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getRoadmap,
  updateProgress,
  getSandboxLabs,
  bookMentorSession
} = require('../controllers/learningController');
const { protect } = require('../middleware/authMiddleware');

router.get('/roadmap', protect, getRoadmap);
router.post('/roadmap/progress', protect, updateProgress);
router.get('/sandbox-labs', protect, getSandboxLabs);
router.post('/mentor/book', protect, bookMentorSession);

module.exports = router;
