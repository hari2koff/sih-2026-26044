/**
 * =============================================================================
 * SkillBridge Weighted Vector Skill Equivalence v2 (WVSE-v2) Matching Engine
 * =============================================================================
 * Implements deterministic matching with trust-tier weighting and core deficit penalties.
 * 
 * Formula:
 * Score = [ sum_i( W_i * min(1.0, Level_i / Cutoff_i) * Trust_i ) / sum_i( W_i ) ] * 100
 *         - CoreDeficitPenalty
 */

const TRUST_TIERS = {
  tier_3_verified: { multiplier: 1.00, label: 'Tier 3 (Verified Assessment / Certificate)', badge: 'Verified' },
  tier_2_assessed: { multiplier: 0.75, label: 'Tier 2 (Faculty/Lab Assessed)', badge: 'Assessed' },
  tier_1_self_claimed: { multiplier: 0.40, label: 'Tier 1 (Self Claimed)', badge: 'Self-Claimed' }
};

/**
 * Calculates WVSE-v2 match score between a student's skills and an internship's requirements
 * 
 * @param {Array} studentSkills - List of skills student possesses [{ skill_code, skill_name, proficiency_level, evidence_tier }]
 * @param {Array} requirements - List of internship required skills [{ skill_code, skill_name, required_level, weight, is_mandatory }]
 * @returns {Object} Match analytics, detailed breakdown, radar vectors, and explainable AI insights
 */
function calculateWVSEMatch(studentSkills = [], requirements = []) {
  if (!requirements || requirements.length === 0) {
    return {
      matchScore: 0,
      confidenceScore: 0,
      status: 'No Requirements Specified',
      breakdown: [],
      mandatoryPassed: true,
      deficits: [],
      strengths: []
    };
  }

  // Create lookup map for student skills
  const studentSkillMap = new Map();
  studentSkills.forEach(s => {
    const code = (s.skill_code || s.code || s.name || '').toLowerCase().trim();
    studentSkillMap.set(code, s);
  });

  let totalWeight = 0;
  let weightedAchieved = 0;
  let coreDeficitPenalty = 0;
  let allMandatorySatisfied = true;
  const breakdown = [];
  const deficits = [];
  const strengths = [];

  requirements.forEach(req => {
    const code = (req.skill_code || req.code || req.name || '').toLowerCase().trim();
    const weight = parseFloat(req.weight || 1.0);
    const cutoff = Math.max(1, parseInt(req.required_level || 50, 10));
    const isMandatory = !!req.is_mandatory;

    totalWeight += weight;

    const studentSkill = studentSkillMap.get(code);
    const rawLevel = studentSkill ? parseInt(studentSkill.proficiency_level || 0, 10) : 0;
    const evidenceTier = studentSkill ? (studentSkill.evidence_tier || 'tier_1_self_claimed') : 'tier_1_self_claimed';
    const trustConfig = TRUST_TIERS[evidenceTier] || TRUST_TIERS.tier_1_self_claimed;
    const trustMultiplier = trustConfig.multiplier;

    // Proficiency ratio capped at 1.0
    const ratio = Math.min(1.0, rawLevel / cutoff);
    const weightedSkillScore = weight * ratio * trustMultiplier;
    weightedAchieved += weightedSkillScore;

    const gap = cutoff - rawLevel;
    const isSatisfied = rawLevel >= cutoff;

    if (isMandatory && !isSatisfied) {
      allMandatorySatisfied = false;
      // Core Deficit Penalty: penalize 12% of the requirement weight for missing mandatory cutoffs
      const penalty = ((cutoff - rawLevel) / cutoff) * 0.12 * weight;
      coreDeficitPenalty += penalty;
    }

    const item = {
      skill_name: req.skill_name || req.name || code,
      skill_code: code,
      required_level: cutoff,
      student_level: rawLevel,
      weight: weight,
      is_mandatory: isMandatory,
      evidence_tier: evidenceTier,
      trust_multiplier: trustMultiplier,
      ratio: Math.round(ratio * 100) / 100,
      contribution: Math.round(weightedSkillScore * 100) / 100,
      gap: gap > 0 ? gap : 0,
      status: isSatisfied ? 'Met' : (rawLevel > 0 ? 'Deficit' : 'Missing')
    };

    breakdown.push(item);

    if (gap > 0) {
      deficits.push({
        skill: item.skill_name,
        deficit_points: gap,
        is_mandatory: isMandatory,
        priority: isMandatory ? 'HIGH' : (gap > 30 ? 'MEDIUM' : 'LOW')
      });
    } else {
      strengths.push({
        skill: item.skill_name,
        surplus_points: rawLevel - cutoff,
        tier: evidenceTier
      });
    }
  });

  const baseScore = totalWeight > 0 ? (weightedAchieved / totalWeight) * 100 : 0;
  const normalizedPenalty = totalWeight > 0 ? (coreDeficitPenalty / totalWeight) * 100 : 0;
  const finalMatchScore = Math.max(0, Math.min(100, Math.round(baseScore - normalizedPenalty)));

  // Determine readiness status
  let readinessTier = 'Needs Foundation';
  if (finalMatchScore >= 85) readinessTier = 'Direct Hire Ready (Tier A)';
  else if (finalMatchScore >= 70) readinessTier = 'Internship Qualified (Tier B)';
  else if (finalMatchScore >= 50) readinessTier = 'Bridging Fast-Track (Tier C)';

  // Generate Explainable AI Reasoning Notes
  const explainableReasons = [
    `Base proficiency alignment: ${Math.round(baseScore)}% across ${requirements.length} target competencies.`,
    `Evidence Trust Multiplier applied: ${breakdown.filter(b => b.evidence_tier === 'tier_3_verified').length} skills verified via Proctor/Cert (1.00x), ${breakdown.filter(b => b.evidence_tier === 'tier_2_assessed').length} assessed (0.75x).`,
    normalizedPenalty > 0 ? `Core deficit penalty (-${Math.round(normalizedPenalty)}%) applied due to unmet mandatory requirements.` : 'All mandatory cutoffs fulfilled with zero penalty.',
    deficits.length > 0 ? `Top priority gap to bridge: ${deficits[0].skill} (Deficit of ${deficits[0].deficit_points}%).` : 'Comprehensive syllabus alignment achieved.'
  ];

  return {
    matchScore: finalMatchScore,
    baseScore: Math.round(baseScore),
    penaltyScore: Math.round(normalizedPenalty),
    readinessTier,
    allMandatorySatisfied,
    breakdown,
    deficits,
    strengths,
    explainableReasons
  };
}

module.exports = {
  calculateWVSEMatch,
  TRUST_TIERS
};
