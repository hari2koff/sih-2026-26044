/**
 * =============================================================================
 * SkillBridge Institution & BoS Curriculum Governance Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getOverview,
  getFaculty,
  getSyllabusProposals,
  createSyllabusProposal,
  updateProposalStatus
} = require('../controllers/institutionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/overview', protect, getOverview);
router.get('/faculty', protect, getFaculty);
router.get('/syllabus-proposals', protect, getSyllabusProposals);
router.post('/syllabus-proposals', protect, createSyllabusProposal);
router.put('/syllabus-proposals/:id/status', protect, updateProposalStatus);

module.exports = router;
