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
  tier_4_industry: { multiplier: 1.00, level: 4, label: 'Level 4 (Industry / External Credential)', badge: 'Industry Verified', confidence: 95 },
  tier_3_verified: { multiplier: 0.90, level: 3, label: 'Level 3 (Faculty / Institution Verified)', badge: 'Faculty Verified', confidence: 85 },
  tier_2_assessed: { multiplier: 0.75, level: 2, label: 'Level 2 (Assessment Verified)', badge: 'Assessment Verified', confidence: 70 },
  tier_1_self_claimed: { multiplier: 0.40, level: 1, label: 'Level 1 (Self Declared)', badge: 'Self Declared', confidence: 30 }
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

  // Calculate overall evidence confidence score
  let totalConfidence = 0;
  let confCount = 0;
  requirements.forEach(req => {
    const code = (req.skill_code || req.code || req.name || '').toLowerCase().trim();
    const studentSkill = studentSkillMap.get(code);
    const tier = studentSkill ? (studentSkill.evidence_tier || 'tier_1_self_claimed') : 'tier_1_self_claimed';
    const conf = (TRUST_TIERS[tier] || TRUST_TIERS.tier_1_self_claimed).confidence;
    totalConfidence += conf;
    confCount++;
  });
  const evidenceConfidence = confCount > 0 ? Math.round(totalConfidence / confCount) : 40;

  // Determine readiness status
  let readinessTier = 'Needs Foundation';
  if (finalMatchScore >= 85) readinessTier = 'Direct Hire Ready (Tier A)';
  else if (finalMatchScore >= 70) readinessTier = 'Internship Qualified (Tier B)';
  else if (finalMatchScore >= 50) readinessTier = 'Bridging Fast-Track (Tier C)';

  // Generate Explainable AI Reasoning Notes
  const tier4Count = breakdown.filter(b => b.evidence_tier === 'tier_4_industry').length;
  const tier3Count = breakdown.filter(b => b.evidence_tier === 'tier_3_verified').length;
  const tier2Count = breakdown.filter(b => b.evidence_tier === 'tier_2_assessed').length;
  const tier1Count = breakdown.filter(b => b.evidence_tier === 'tier_1_self_claimed').length;

  const explainableReasons = [
    `Base proficiency alignment: ${Math.round(baseScore)}% across ${requirements.length} target competencies.`,
    `Evidence Trust Multipliers: ${tier4Count} Industry Verified (1.00x), ${tier3Count} Faculty Verified (0.90x), ${tier2Count} Assessment Verified (0.75x), ${tier1Count} Self-Declared (0.40x). Overall Confidence: ${evidenceConfidence}%.`,
    normalizedPenalty > 0 ? `Core deficit penalty (-${Math.round(normalizedPenalty)}%) applied due to unmet mandatory requirements.` : 'All mandatory cutoffs fulfilled with zero penalty.',
    deficits.length > 0 ? `Top priority gap to bridge: ${deficits[0].skill} (Deficit of ${deficits[0].deficit_points}%).` : 'Comprehensive syllabus alignment achieved.'
  ];

  return {
    matchScore: finalMatchScore,
    evidenceConfidence,
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
