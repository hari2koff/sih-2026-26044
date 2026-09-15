/**
 * =============================================================================
 * SkillBridge Analytics & Market Intelligence Controller
 * =============================================================================
 * Aggregates platform KPIs, macro market surges, and cohort deficit benchmarks.
 */

const { getPlatformOverview, getCompanyTalentAnalytics } = require('../services/analyticsService');
const { computeCohortGaps } = require('../services/skillGapService');

/**
 * Get platform overview metrics & market trends
 * GET /api/v1/analytics/overview
 */
const getPlatformMetrics = async (req, res) => {
  try {
    const data = getPlatformOverview();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve platform analytics', error: err.message });
  }
};

/**
 * Get cohort-wide skill gap analytics for Academic Governance
 * GET /api/v1/analytics/cohort-gaps
 */
const getCohortGaps = async (req, res) => {
  try {
    const gaps = computeCohortGaps();
    res.json({
      success: true,
      institution: 'National Institute of Technology (NIT-01)',
      academic_year: '2026-2027',
      data: gaps
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute cohort gaps', error: err.message });
  }
};

/**
 * Get recruiter / enterprise talent analytics
 * GET /api/v1/analytics/company/:id
 */
const getCompanyAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = getCompanyTalentAnalytics(id);
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve company analytics', error: err.message });
  }
};

module.exports = {
  getPlatformMetrics,
  getCohortGaps,
  getCompanyAnalytics
};
