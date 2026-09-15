/**
 * =============================================================================
 * SkillBridge Student Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getProfile,
  getCohort,
  getStudentById,
  updateSkills,
  verifyCertificate,
  getCertifications
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Student profile & cohort
router.get('/profile', protect, getProfile);
router.get('/cohort', protect, getCohort);
router.get('/certificates', protect, getCertifications);
router.post('/skills', protect, updateSkills);
router.post('/verify-certificate', protect, verifyCertificate);
router.get('/:id', protect, getStudentById);

module.exports = router;
