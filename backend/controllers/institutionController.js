/**
 * =============================================================================
 * SkillBridge Institution & Academic Governance Controller
 * =============================================================================
 * Handles institutional profiles, faculty roster, and Board of Studies (BoS)
 * dynamic curriculum revision proposals.
 */

const { memoryStore, query, isPostgresConnected } = require('../config/database');
const { computeCohortGaps } = require('../services/skillGapService');

/**
 * Get institutional overview & accreditation health
 * GET /api/v1/institutions/overview
 */
const getOverview = async (req, res) => {
  try {
    const inst = memoryStore.institutions[0];
    const faculty = memoryStore.faculty;
    const proposals = memoryStore.syllabusProposals;
    const cohortGaps = computeCohortGaps();

    res.json({
      success: true,
      institution: {
        id: inst.id,
        name: inst.name,
        code: inst.code,
        dean: {
          name: inst.dean_name,
          email: inst.dean_email,
          title: 'Dean of Academic Affairs & Board of Studies Chairperson'
        },
        address: inst.address,
        state: inst.state
      },
      metrics: {
        total_faculty_mentors: faculty.length,
        curriculum_proposals_active: proposals.length,
        critical_syllabus_deficits: cohortGaps.critical_deficits_count,
        institutional_industry_alignment: '78.4%',
        target_accreditation_standard: 'NBA / NAAC Tier-1 Compliance'
      },
      faculty_roster: faculty,
      cohort_gap_analysis: cohortGaps
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch institution overview', error: err.message });
  }
};

/**
 * Get faculty members
 * GET /api/v1/institutions/faculty
 */
const getFaculty = async (req, res) => {
  try {
    res.json({
      success: true,
      count: memoryStore.faculty.length,
      data: memoryStore.faculty
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve faculty roster', error: err.message });
  }
};

/**
 * Get BoS curriculum proposals
 * GET /api/v1/institutions/syllabus-proposals
 */
const getSyllabusProposals = async (req, res) => {
  try {
    const { status } = req.query;
    let proposals = memoryStore.syllabusProposals;

    if (status) {
      proposals = proposals.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    res.json({
      success: true,
      count: proposals.length,
      chairperson: 'Dr. S. K. Mukherjee (Dean Academics)',
      data: proposals
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve syllabus proposals', error: err.message });
  }
};

/**
 * Submit new BoS curriculum revision proposal
 * POST /api/v1/institutions/syllabus-proposals
 */
const createSyllabusProposal = async (req, res) => {
  try {
    const {
      course_code,
      title,
      department,
      proposer_id,
      industry_partner_id,
      proposed_modules,
      credits,
      deficit_justification
    } = req.body;

    if (!course_code || !title || !proposed_modules) {
      return res.status(400).json({
        success: false,
        message: 'course_code, title, and proposed_modules are required'
      });
    }

    const newProposal = {
      id: `prop-${Date.now()}`,
      institution_id: 'inst-nit',
      course_code,
      title,
      department: department || 'Computer Science & Engineering',
      proposer_id: proposer_id || 'fac-1',
      proposer_name: 'Prof. Rajesh Kumar (HOD CSE)',
      industry_partner_id: industry_partner_id || 'c-technova',
      industry_partner_name: 'TechNova Solutions & Cloud Alliance',
      proposed_modules: Array.isArray(proposed_modules) ? proposed_modules : [proposed_modules],
      credits: credits || 4,
      status: 'under_review',
      deficit_justification: deficit_justification || 'Cohort telemetry indicates 44% deficit in container orchestration and microservices.',
      created_at: new Date().toISOString()
    };

    memoryStore.syllabusProposals.unshift(newProposal);

    res.status(201).json({
      success: true,
      message: 'Board of Studies curriculum proposal submitted for Dean approval',
      proposal: newProposal
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit proposal', error: err.message });
  }
};

/**
 * Approve or update status of curriculum proposal (Dean role)
 * PUT /api/v1/institutions/syllabus-proposals/:id/status
 */
const updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const proposal = memoryStore.syllabusProposals.find(p => p.id === id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: `Proposal '${id}' not found` });
    }

    proposal.status = status || 'approved';
    proposal.reviewed_by = 'Dr. S. K. Mukherjee (Dean Academics)';
    proposal.remarks = remarks || 'Approved for 2026-27 Academic Curriculum rollout.';
    proposal.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: `Curriculum proposal marked as ${proposal.status}`,
      data: proposal
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update proposal', error: err.message });
  }
};

module.exports = {
  getOverview,
  getFaculty,
  getSyllabusProposals,
  createSyllabusProposal,
  updateProposalStatus
};
