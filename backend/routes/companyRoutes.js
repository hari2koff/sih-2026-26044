/**
 * =============================================================================
 * SkillBridge Company & Recruiter Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyById,
  getCandidates,
  recordInterviewTelemetry
} = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCompanies);
router.get('/:id', protect, getCompanyById);
router.get('/:id/candidates', protect, getCandidates);
router.post('/telemetry', protect, recordInterviewTelemetry);

module.exports = router;
