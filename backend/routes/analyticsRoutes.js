/**
 * =============================================================================
 * SkillBridge Market Intelligence & Cohort Analytics Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getPlatformMetrics,
  getCohortGaps,
  getCompanyAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/overview', protect, getPlatformMetrics);
router.get('/cohort-gaps', protect, getCohortGaps);
router.get('/company/:id', protect, getCompanyAnalytics);

module.exports = router;
