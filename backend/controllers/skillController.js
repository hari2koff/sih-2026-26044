/**
 * =============================================================================
 * SkillBridge Skills & Adaptive Assessment Controller
 * =============================================================================
 * Manages taxonomy of competencies, proctored quizzes, and automated scoring.
 */

const { memoryStore, query, isPostgresConnected } = require('../config/database');

// Question bank for interactive skill assessments
const ASSESSMENT_BANK = {
  cloud_docker: [
    {
      id: 'q1',
      question: 'What is the primary difference between a Docker Image and a Docker Container?',
      options: [
        'An image is a running instance of a container',
        'An image is a read-only template, while a container is a runnable instance with a writable layer',
        'Containers cannot run without a hypervisor VM installed',
        'Images are stored in RAM, containers are stored on disk'
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      question: 'Which Dockerfile instruction is used to define the default executable and arguments that cannot be overridden easily?',
      options: ['RUN', 'CMD', 'ENTRYPOINT', 'EXPOSE'],
      correctIndex: 2
    },
    {
      id: 'q3',
      question: 'In Docker multi-stage builds, what is the primary benefit?',
      options: [
        'Enables running multiple containers simultaneously',
        'Reduces final production image size by copying only build artifacts from previous stages',
        'Allows running x86 binaries on ARM processors',
        'Automatically adds SSL certificates to containers'
      ],
      correctIndex: 1
    },
    {
      id: 'q4',
      question: 'How do you persist container data across container restarts and removals?',
      options: ['Docker Volumes / Bind Mounts', 'Docker Swarm Nodes', 'Docker Bridge Network', 'EXPOSE 8080'],
      correctIndex: 0
    }
  ],
  db_pg: [
    {
      id: 'q1',
      question: 'Which PostgreSQL index type is optimal for indexing full-text search tsvector columns?',
      options: ['B-Tree', 'GIN (Generalized Inverted Index)', 'Hash', 'BRIN'],
      correctIndex: 1
    },
    {
      id: 'q2',
      question: 'What does the MVCC (Multi-Version Concurrency Control) architecture in PostgreSQL accomplish?',
      options: [
        'It blocks all readers when a writer modifies a row',
        'Readers do not block writers and writers do not block readers',
        'It forces all tables to be strictly in-memory',
        'It prevents creating foreign keys'
      ],
      correctIndex: 1
    }
  ],
  prog_react: [
    {
      id: 'q1',
      question: 'When does the cleanup function in useEffect run?',
      options: [
        'Only when the component mounts',
        'Before the component unmounts and before re-running the effect due to dependency change',
        'Only on fatal errors',
        'Every time state is read'
      ],
      correctIndex: 1
    }
  ]
};

/**
 * Get all available skills organized by category
 * GET /api/v1/skills
 */
const getAllSkills = async (req, res) => {
  try {
    const { category } = req.query;
    let skills = memoryStore.skills;

    if (category) {
      skills = skills.filter(s => s.category.toLowerCase().includes(category.toLowerCase()));
    }

    // Group by category for frontend convenience
    const categorized = {};
    skills.forEach(s => {
      if (!categorized[s.category]) categorized[s.category] = [];
      categorized[s.category].push(s);
    });

    res.json({
      success: true,
      total_skills: skills.length,
      categories: Object.keys(categorized),
      data: skills,
      grouped: categorized
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve skills', error: err.message });
  }
};

/**
 * Get skill detail by code
 * GET /api/v1/skills/:code
 */
const getSkillByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const skill = memoryStore.skills.find(s => s.code.toLowerCase() === code.toLowerCase());

    if (!skill) {
      return res.status(404).json({ success: false, message: `Skill '${code}' not found` });
    }

    const hasAssessment = !!ASSESSMENT_BANK[code.toLowerCase()];

    res.json({
      success: true,
      data: {
        ...skill,
        has_interactive_assessment: hasAssessment,
        benchmark_readiness_standard: 'Industry Level: ' + skill.industry_benchmark + '%'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve skill details', error: err.message });
  }
};

/**
 * Get interactive assessment questions for a skill
 * GET /api/v1/skills/:code/assessment
 */
const getSkillAssessment = async (req, res) => {
  try {
    const { code } = req.params;
    const questions = ASSESSMENT_BANK[code.toLowerCase()] || ASSESSMENT_BANK.cloud_docker;

    // Strip answers before sending to client
    const sanitizedQuestions = questions.map((q, idx) => ({
      id: q.id,
      index: idx + 1,
      question: q.question,
      options: q.options
    }));

    res.json({
      success: true,
      skill_code: code,
      total_questions: sanitizedQuestions.length,
      duration_minutes: 15,
      passing_score_percent: 75,
      questions: sanitizedQuestions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate assessment', error: err.message });
  }
};

/**
 * Submit assessment answers and calculate score
 * POST /api/v1/skills/:code/assessment
 */
const submitAssessment = async (req, res) => {
  try {
    const { code } = req.params;
    const { answers } = req.body; // Array of selected option indices e.g. [1, 2, 1, 0]
    const studentId = req.user ? (req.user.student_id || 'f-s1') : 'f-s1';

    const bank = ASSESSMENT_BANK[code.toLowerCase()] || ASSESSMENT_BANK.cloud_docker;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'answers array is required' });
    }

    let correctCount = 0;
    const detailedResults = bank.map((q, idx) => {
      const studentAns = answers[idx];
      const isCorrect = studentAns === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        selected_option: studentAns !== undefined ? q.options[studentAns] : 'Not Answered',
        is_correct: isCorrect,
        correct_option: q.options[q.correctIndex]
      };
    });

    const percentage = Math.round((correctCount / bank.length) * 100);
    const passed = percentage >= 75;

    // If passed, elevate student skill evidence tier
    const student = memoryStore.students.find(s => s.id === studentId);
    let updatedReadiness = 78;

    if (student) {
      if (passed) {
        student.tests_passed = (student.tests_passed || 0) + 1;
        // Boost cloud radar and readiness if Docker
        if (code.toLowerCase().includes('docker')) {
          student.radar_cloud = Math.min(95, (student.radar_cloud || 42) + 30);
          student.critical_gaps_count = Math.max(0, (student.critical_gaps_count || 2) - 1);
        }
        student.overall_readiness = Math.min(98, (student.overall_readiness || 78) + 6);
        student.verified_badges.push(`${code.toUpperCase()} Assessed Specialist`);
        updatedReadiness = student.overall_readiness;
      }
    }

    // Update skill in memory
    if (!memoryStore.studentSkills[studentId]) memoryStore.studentSkills[studentId] = [];
    const existing = memoryStore.studentSkills[studentId].find(s => s.skill_code.toLowerCase() === code.toLowerCase());
    if (existing) {
      existing.proficiency_level = Math.max(existing.proficiency_level, percentage);
      if (passed) existing.evidence_tier = 'tier_2_assessed';
    } else {
      memoryStore.studentSkills[studentId].push({
        id: `ss-${Date.now()}`,
        skill_id: `sk-${code}`,
        skill_code: code,
        skill_name: code.toUpperCase(),
        proficiency_level: percentage,
        evidence_tier: passed ? 'tier_2_assessed' : 'tier_1_self_claimed',
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      score: percentage,
      correct_count: correctCount,
      total_questions: bank.length,
      passed,
      evidence_tier_awarded: passed ? 'Tier 2 (Faculty/Lab Assessed - 0.75x Multiplier)' : 'Tier 1 (Needs Retake)',
      updated_readiness: updatedReadiness,
      breakdown: detailedResults
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Assessment evaluation error', error: err.message });
  }
};

module.exports = {
  getAllSkills,
  getSkillByCode,
  getSkillAssessment,
  submitAssessment
};
