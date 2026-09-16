/**
 * =============================================================================
 * SkillBridge Institution & Academic Governance Controller
 * =============================================================================
 * Handles institutional profiles, faculty roster, and Board of Studies (BoS)
 * dynamic curriculum revision proposals.
 */

const { memoryStore, query, isPostgresConnected, saveToDiskDatabase } = require('../config/database');
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

/**
 * Get pending student skill evidence verification queue
 * GET /api/v1/institutions/verifications
 */
const getPendingVerifications = async (req, res) => {
  try {
    const queue = memoryStore.pendingVerifications || [];
    res.json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve verification queue', error: err.message });
  }
};

/**
 * Action a student evidence verification (Verify, Reject, Request Info)
 * POST /api/v1/institutions/verifications/:id/action
 */
const actionVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, faculty_remarks, faculty_name, notes } = req.body;
    const reviewRemarks = faculty_remarks || notes;

    const verifications = memoryStore.pendingVerifications || [];
    const itemIndex = verifications.findIndex(v => v.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: `Verification request '${id}' not found` });
    }

    const item = verifications[itemIndex];
    const reviewerName = faculty_name || 'Prof. Rajesh Kumar (HOD CSE)';

    if (action === 'verify') {
      item.status = 'verified';
      item.verified_by = reviewerName;
      item.verified_at = new Date().toISOString();
      item.remarks = reviewRemarks || 'Endorsed and validated against academic & industry benchmarks.';

      // Remove from pending queue
      verifications.splice(itemIndex, 1);

      // 1. Update evidence item in student's evidence collection
      const studentEvidence = memoryStore.skillEvidence[item.student_id];
      if (studentEvidence) {
        const ev = studentEvidence.find(e => e.id === item.evidence_id || (e.skill_code === item.skill_code && e.title === item.title));
        if (ev) {
          ev.status = 'verified';
          ev.verified_by = reviewerName;
          ev.tier = item.tier_requested || 'tier_3_verified';
          ev.level = item.level || 3;
          ev.confidence = 90;
        }
      }

      // 2. Elevate student's skill in memoryStore.studentSkills
      const studentSkills = memoryStore.studentSkills[item.student_id];
      if (studentSkills) {
        let skill = studentSkills.find(s => s.skill_code && s.skill_code.toLowerCase() === item.skill_code.toLowerCase());
        if (skill) {
          skill.evidence_tier = item.tier_requested || 'tier_3_verified';
          skill.proficiency_level = Math.min(95, Math.max(skill.proficiency_level || 50, 82));
        } else {
          studentSkills.push({
            id: `ss-${Date.now()}`,
            skill_code: item.skill_code,
            skill_name: item.skill_name,
            proficiency_level: 82,
            evidence_tier: item.tier_requested || 'tier_3_verified',
            category: 'Verified Competency'
          });
        }
      }

      // 3. Elevate student radar and readiness
      const student = memoryStore.students.find(s => s.id === item.student_id);
      if (student) {
        student.verified_badges_count = (student.verified_badges_count || 1) + 1;
        student.overall_readiness = Math.min(98, (student.overall_readiness || 70) + 5);
        if (item.skill_code.includes('docker') || item.skill_code.includes('cloud')) {
          student.radar_cloud = Math.min(95, (student.radar_cloud || 40) + 25);
          student.critical_gaps_count = Math.max(0, (student.critical_gaps_count || 1) - 1);
        } else if (item.skill_code.includes('python') || item.skill_code.includes('prog')) {
          student.radar_prog = Math.min(98, (student.radar_prog || 75) + 10);
        }
      }

      // 4. Record student activity feed
      if (!memoryStore.skillActivity[item.student_id]) memoryStore.skillActivity[item.student_id] = [];
      memoryStore.skillActivity[item.student_id].unshift({
        id: `act-${Date.now()}`,
        time: 'Just now',
        text: `"${item.title}" for ${item.skill_name} officially verified by ${reviewerName}! Skill elevated to Level ${item.level}.`,
        type: 'faculty',
        color: '#00f5a0'
      });

      // 5. Update timeline
      if (!memoryStore.skillTimeline[item.student_id]) memoryStore.skillTimeline[item.student_id] = [];
      memoryStore.skillTimeline[item.student_id].unshift({
        id: `tl-${Date.now()}`,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: item.title,
        type: item.level === 4 ? 'Industry Verified' : 'Faculty Verified',
        level: item.level,
        score: item.score_or_grade,
        badge: item.level === 4 ? 'Industry Credential' : 'Faculty Endorsed',
        icon: '✓',
        status: 'verified',
        detail: `Verified by ${reviewerName}. ${item.remarks}`
      });

      saveToDiskDatabase();

      return res.json({
        success: true,
        message: `Skill evidence for ${item.student_name} verified and endorsed successfully!`,
        action: 'verified',
        data: {
          ...item,
          updatedReadiness: student ? student.overall_readiness : 83
        }
      });
    } else if (action === 'reject') {
      item.status = 'rejected';
      item.reviewed_by = reviewerName;
      item.remarks = faculty_remarks || 'Evidence criteria not met. Please resubmit with verifiable documentation.';
      verifications.splice(itemIndex, 1);

      if (!memoryStore.skillActivity[item.student_id]) memoryStore.skillActivity[item.student_id] = [];
      memoryStore.skillActivity[item.student_id].unshift({
        id: `act-${Date.now()}`,
        time: 'Just now',
        text: `Evidence for ${item.skill_name} was rejected: ${item.remarks}`,
        type: 'faculty',
        color: '#f43f5e'
      });

      saveToDiskDatabase();

      return res.json({
        success: true,
        message: 'Evidence submission rejected.',
        action: 'rejected',
        data: item
      });
    } else {
      // request_info
      item.status = 'needs_info';
      item.remarks = faculty_remarks || 'Additional verification documentation requested by department.';

      if (!memoryStore.skillActivity[item.student_id]) memoryStore.skillActivity[item.student_id] = [];
      memoryStore.skillActivity[item.student_id].unshift({
        id: `act-${Date.now()}`,
        time: 'Just now',
        text: `Faculty requested additional documentation for "${item.title}": ${item.remarks}`,
        type: 'faculty',
        color: '#f59e0b'
      });

      saveToDiskDatabase();

      return res.json({
        success: true,
        message: 'Information request sent to student.',
        action: 'needs_info',
        data: item
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process verification action', error: err.message });
  }
};

module.exports = {
  getOverview,
  getFaculty,
  getSyllabusProposals,
  createSyllabusProposal,
  updateProposalStatus,
  getPendingVerifications,
  actionVerification
};
