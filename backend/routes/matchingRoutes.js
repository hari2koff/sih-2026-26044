/**
 * =============================================================================
 * SkillBridge WVSE-v2 Matching & Explainable AI Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  calculateMatch,
  getExplainableBreakdown
} = require('../controllers/matchingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/evaluate', protect, calculateMatch);
router.get('/explain', protect, getExplainableBreakdown);

module.exports = router;
