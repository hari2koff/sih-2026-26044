/**
 * =============================================================================
 * SkillBridge Internship & Industry Opportunities Controller
 * =============================================================================
 * Manages internship listings, requirement criteria, and student applications.
 */

const { memoryStore, query, isPostgresConnected } = require('../config/database');
const { calculateWVSEMatch } = require('../services/matchingService');

/**
 * Get all active internships with optional filtering
 * GET /api/v1/internships
 */
const getInternships = async (req, res) => {
  try {
    const { category, minStipend, companyId } = req.query;
    let list = memoryStore.internships;

    if (category) {
      list = list.filter(i => i.title.toLowerCase().includes(category.toLowerCase()));
    }
    if (minStipend) {
      list = list.filter(i => (i.stipend_amount || 0) >= parseInt(minStipend, 10));
    }
    if (companyId) {
      list = list.filter(i => i.company_id === companyId);
    }

    // Attach company info to each internship
    const enriched = list.map(internship => {
      const company = memoryStore.companies.find(c => c.id === internship.company_id);
      const reqs = memoryStore.internshipRequirements[internship.id] || [];
      return {
        ...internship,
        company_name: company ? company.name : 'Industry Partner',
        company_tier: company ? company.tier : 'Tier 1',
        requirements_count: reqs.length,
        requirements: reqs
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve internships', error: err.message });
  }
};

/**
 * Get single internship detail with requirements
 * GET /api/v1/internships/:id
 */
const getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = memoryStore.internships.find(i => i.id === id);

    if (!internship) {
      return res.status(404).json({ success: false, message: `Internship '${id}' not found` });
    }

    const company = memoryStore.companies.find(c => c.id === internship.company_id);
    const requirements = memoryStore.internshipRequirements[id] || [];

    // If logged in student, calculate their personal WVSE match score against this position
    let studentMatch = null;
    const studentId = req.user ? (req.user.student_id || 'f-s1') : 'f-s1';
    const studentSkills = memoryStore.studentSkills[studentId] || [];

    if (studentSkills.length > 0) {
      studentMatch = calculateWVSEMatch(studentSkills, requirements);
    }

    res.json({
      success: true,
      data: {
        ...internship,
        company: company || { name: 'Industry Partner' },
        requirements,
        candidate_match: studentMatch
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve internship details', error: err.message });
  }
};

/**
 * Apply to an internship with real-time WVSE-v2 qualification check
 * POST /api/v1/internships/:id/apply
 */
const applyInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user ? (req.user.student_id || 'f-s1') : 'f-s1';

    const internship = memoryStore.internships.find(i => i.id === id);
    if (!internship) {
      return res.status(404).json({ success: false, message: `Internship '${id}' not found` });
    }

    const student = memoryStore.students.find(s => s.id === studentId);
    const studentSkills = memoryStore.studentSkills[studentId] || [];
    const requirements = memoryStore.internshipRequirements[id] || [];

    // Run WVSE-v2 match calculation
    const match = calculateWVSEMatch(studentSkills, requirements);

    const application = {
      id: `app-${Date.now()}`,
      internship_id: id,
      internship_title: internship.title,
      student_id: studentId,
      student_name: student ? student.name : 'Hariprasad PS',
      match_score: match.matchScore,
      all_mandatory_satisfied: match.allMandatorySatisfied,
      readiness_tier: match.readinessTier,
      status: match.matchScore >= 70 ? 'shortlisted' : 'submitted',
      applied_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: match.matchScore >= 70
        ? 'Application shortlisted! Your verified skills exceeded the 70% benchmark.'
        : 'Application submitted. We recommend bridging identified skill gaps to boost shortlist priority.',
      application,
      match_analysis: match
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process application', error: err.message });
  }
};

module.exports = {
  getInternships,
  getInternshipById,
  applyInternship
};
