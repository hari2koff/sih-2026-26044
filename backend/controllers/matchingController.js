/**
 * =============================================================================
 * SkillBridge Matching & Explainable AI Controller
 * =============================================================================
 * Exposes WVSE-v2 mathematical scoring endpoints and Explainable AI rationales.
 */

const { memoryStore } = require('../config/database');
const { calculateWVSEMatch, TRUST_TIERS } = require('../services/matchingService');

/**
 * Calculate match between a student and an internship
 * POST /api/v1/matching/evaluate
 */
const calculateMatch = async (req, res) => {
  try {
    const { student_id, internship_id, custom_skills, custom_requirements } = req.body;

    let skills = custom_skills;
    let requirements = custom_requirements;

    const studentId = student_id || (req.user ? (req.user.student_id || 'f-s1') : 'f-s1');
    const internshipId = internship_id || 'i-technova-fs';

    if (!skills) {
      skills = memoryStore.studentSkills[studentId] || [];
    }
    if (!requirements) {
      requirements = memoryStore.internshipRequirements[internshipId] || [];
    }

    const student = memoryStore.students.find(s => s.id === studentId);
    const internship = memoryStore.internships.find(i => i.id === internshipId);

    const match = calculateWVSEMatch(skills, requirements);

    res.json({
      success: true,
      student: student ? { id: student.id, name: student.name, roll_no: student.roll_no } : { id: studentId },
      internship: internship ? { id: internship.id, title: internship.title, company_id: internship.company_id } : { id: internshipId },
      algorithm: 'WVSE-v2 (Weighted Vector Skill Equivalence)',
      evaluation: match
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Matching calculation failed', error: err.message });
  }
};

/**
 * Get Explainable AI breakdown with mathematical audit trail
 * GET /api/v1/matching/explain
 */
const getExplainableBreakdown = async (req, res) => {
  try {
    const { studentId = 'f-s1', internshipId = 'i-technova-fs' } = req.query;

    const student = memoryStore.students.find(s => s.id === studentId);
    const internship = memoryStore.internships.find(i => i.id === internshipId);
    const skills = memoryStore.studentSkills[studentId] || [];
    const requirements = memoryStore.internshipRequirements[internshipId] || [];

    const match = calculateWVSEMatch(skills, requirements);

    res.json({
      success: true,
      context: {
        student_name: student ? student.name : 'Hariprasad PS',
        target_role: internship ? internship.title : 'Full Stack Developer',
        match_score: `${match.matchScore}%`,
        readiness_tier: match.readinessTier
      },
      mathematical_formula: {
        raw_formula: 'Score = [ sum_i( W_i * min(1.0, Level_i / Cutoff_i) * Trust_i ) / sum_i( W_i ) ] * 100 - CorePenalty',
        trust_weights: TRUST_TIERS,
        total_benchmark_competencies: requirements.length
      },
      step_by_step_audit: match.breakdown.map(b => ({
        competency: b.skill_name,
        target_cutoff: b.required_level,
        student_level: b.student_level,
        achievement_ratio: b.ratio,
        evidence_tier: b.evidence_tier,
        trust_multiplier: b.trust_multiplier,
        weighted_contribution: b.contribution,
        mandatory: b.is_mandatory,
        status: b.status
      })),
      penalties: {
        core_deficit_penalty_applied: `${match.penaltyScore}%`,
        all_mandatory_satisfied: match.allMandatorySatisfied
      },
      reasoning_bullets: match.explainableReasons
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Explainable AI breakdown error', error: err.message });
  }
};

module.exports = {
  calculateMatch,
  getExplainableBreakdown
};
