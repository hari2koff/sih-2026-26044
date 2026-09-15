/**
 * =============================================================================
 * SkillBridge Industry Events, Hackathons & Sabbaticals Routes
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  enrollInEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/:id/enroll', protect, enrollInEvent);

module.exports = router;
