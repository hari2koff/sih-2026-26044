/**
 * =============================================================================
 * SkillBridge Student Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  getLiveTracking,
  resetData,
  getProfile,
  getCohort,
  getStudentById,
  updateSkills,
  verifyCertificate,
  getCertifications,
  getEvidence,
  addEvidence
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Public Registration & Authentication
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/reset-data', resetData);

// Live Student Tracking & Profile
router.get('/live-tracking', protect, getLiveTracking);
router.get('/evidence', protect, getEvidence);
router.post('/evidence', protect, addEvidence);
router.get('/profile', protect, getProfile);
router.get('/cohort', protect, getCohort);
router.get('/certificates', protect, getCertifications);
router.post('/skills', protect, updateSkills);
router.post('/verify-certificate', protect, verifyCertificate);
router.get('/:id', protect, getStudentById);

module.exports = router;
