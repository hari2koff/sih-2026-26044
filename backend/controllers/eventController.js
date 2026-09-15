/**
 * =============================================================================
 * SkillBridge Industry Events & Faculty Sabbatical Controller
 * =============================================================================
 * Manages hackathons, sabbaticals, joint R&D collaborations, and faculty FDPs.
 */

const { memoryStore, query, isPostgresConnected } = require('../config/database');

/**
 * Get all events with optional category filtering
 * GET /api/v1/events
 */
const getEvents = async (req, res) => {
  try {
    const { category, upcoming } = req.query;
    let events = memoryStore.events;

    if (category) {
      events = events.filter(e => e.category.toLowerCase().includes(category.toLowerCase()));
    }

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve events', error: err.message });
  }
};

/**
 * Get event details by ID
 * GET /api/v1/events/:id
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = memoryStore.events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({ success: false, message: `Event '${id}' not found` });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve event details', error: err.message });
  }
};

/**
 * Enroll or register for an event (Student or Faculty)
 * POST /api/v1/events/:id/enroll
 */
const enrollInEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : 'u-student-1';
    const role = req.user ? req.user.role : 'student';

    const event = memoryStore.events.find(e => e.id === id);
    if (!event) {
      return res.status(404).json({ success: false, message: `Event '${id}' not found` });
    }

    const enrollment = {
      id: `enr-${Date.now()}`,
      event_id: id,
      event_title: event.title,
      user_id: userId,
      user_role: role,
      status: 'confirmed',
      enrolled_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in '${event.title}'`,
      data: enrollment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to enroll in event', error: err.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  enrollInEvent
};
