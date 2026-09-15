/**
 * =============================================================================
 * SkillBridge Company & Enterprise Recruiter Controller
 * =============================================================================
 * Manages enterprise profiles, candidate talent pools, and interview telemetry.
 */

const { memoryStore, query, isPostgresConnected } = require('../config/database');
const { calculateWVSEMatch } = require('../services/matchingService');

/**
 * Get list of all partner companies
 * GET /api/v1/companies
 */
const getCompanies = async (req, res) => {
  try {
    const { tier, industry } = req.query;
    let companies = memoryStore.companies;

    if (tier) {
      companies = companies.filter(c => c.tier.toLowerCase() === tier.toLowerCase());
    }
    if (industry) {
      companies = companies.filter(c => c.industry.toLowerCase().includes(industry.toLowerCase()));
    }

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve companies', error: err.message });
  }
};

/**
 * Get company details by ID with active internships
 * GET /api/v1/companies/:id
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = memoryStore.companies.find(c => c.id === id);

    if (!company) {
      return res.status(404).json({ success: false, message: `Company '${id}' not found` });
    }

    const companyInternships = memoryStore.internships.filter(i => i.company_id === id);

    res.json({
      success: true,
      data: {
        ...company,
        internships: companyInternships
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving company details', error: err.message });
  }
};

/**
 * Get matched talent pool for a company or specific role
 * GET /api/v1/companies/:id/candidates
 */
const getCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const { internshipId } = req.query;

    const company = memoryStore.companies.find(c => c.id === id) || memoryStore.companies[0];
    const targetInternship = internshipId
      ? memoryStore.internships.find(i => i.id === internshipId)
      : memoryStore.internships.find(i => i.company_id === id) || memoryStore.internships[0];

    const requirements = targetInternship ? (memoryStore.internshipRequirements[targetInternship.id] || []) : [];

    // Calculate WVSE-v2 match for every student in cohort
    const rankedCandidates = memoryStore.students.map(student => {
      const studentSkills = memoryStore.studentSkills[student.id] || [];
      const matchResult = calculateWVSEMatch(studentSkills, requirements);

      return {
        student_id: student.id,
        name: student.name,
        roll_no: student.roll_no,
        department: student.department,
        cgpa: student.cgpa,
        overall_readiness: student.overall_readiness,
        verified_badges_count: student.verified_badges_count,
        match_score: matchResult.matchScore,
        readiness_tier: matchResult.readinessTier,
        breakdown: matchResult.breakdown,
        key_strengths: matchResult.strengths,
        key_deficits: matchResult.deficits
      };
    }).sort((a, b) => b.match_score - a.match_score);

    res.json({
      success: true,
      company: company.name,
      role: targetInternship ? targetInternship.title : 'General Pool',
      internship_id: targetInternship ? targetInternship.id : null,
      candidates_count: rankedCandidates.length,
      data: rankedCandidates
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to evaluate candidates', error: err.message });
  }
};

/**
 * Record post-interview telemetry feedback
 * POST /api/v1/companies/telemetry
 */
const recordInterviewTelemetry = async (req, res) => {
  try {
    const {
      student_id,
      company_id,
      role_title,
      technical_score,
      practical_problem_score,
      system_architecture_score,
      feedback_notes,
      hire_verdict
    } = req.body;

    if (!student_id || !technical_score) {
      return res.status(400).json({ success: false, message: 'student_id and technical_score are required' });
    }

    const telemetryRecord = {
      id: `tel-${Date.now()}`,
      student_id,
      company_id: company_id || 'c-technova',
      role_title: role_title || 'Full Stack Engineer',
      technical_score: parseInt(technical_score, 10),
      practical_problem_score: parseInt(practical_problem_score || 80, 10),
      system_architecture_score: parseInt(system_architecture_score || 75, 10),
      feedback_notes: feedback_notes || 'Strong core programming fundamentals. Recommend sharpening container orchestration.',
      hire_verdict: hire_verdict || 'selected_for_next_round',
      created_at: new Date().toISOString()
    };

    memoryStore.interviewTelemetry.push(telemetryRecord);

    res.status(201).json({
      success: true,
      message: 'Interview telemetry logged and queued for BoS curriculum feedback loop',
      telemetry: telemetryRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record interview telemetry', error: err.message });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  getCandidates,
  recordInterviewTelemetry
};
