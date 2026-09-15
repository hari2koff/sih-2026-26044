/**
 * =============================================================================
 * SkillBridge Skills & Proctored Assessment Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getAllSkills,
  getSkillByCode,
  getSkillAssessment,
  submitAssessment
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllSkills);
router.get('/:code', protect, getSkillByCode);
router.get('/:code/assessment', protect, getSkillAssessment);
router.post('/:code/assessment', protect, submitAssessment);

module.exports = router;
