/**
 * =============================================================================
 * SkillBridge Learning Roadmaps & Virtual Sandbox Controller
 * =============================================================================
 * Manages personalized learning trajectories, sandbox labs, and mentorship.
 */

const { memoryStore, query, isPostgresConnected } = require('../config/database');

// Virtual Sandbox interactive scenarios
const SANDBOX_LABS = [
  {
    id: 'lab-docker-1',
    title: 'Multi-Stage Dockerfile Optimization',
    category: 'Cloud & DevOps',
    difficulty: 'Intermediate',
    scenario_description: 'Reduce a 1.2GB Node.js Docker image down to < 120MB using Alpine Linux and multi-stage build patterns.',
    initial_code: 'FROM node:18\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "server.js"]',
    solution_criteria: ['Use multi-stage build', 'Exclude devDependencies in production stage', 'Set non-root user'],
    estimated_time: '25 mins',
    skills_boosted: ['Docker', 'Cloud Deployment']
  },
  {
    id: 'lab-pg-1',
    title: 'PostgreSQL Query Optimization & EXPLAIN ANALYZE',
    category: 'Database Systems',
    difficulty: 'Advanced',
    scenario_description: 'Eliminate a sequential scan on a 5-million row telemetry table using composite B-Tree and GIN indexes.',
    initial_code: 'SELECT student_id, AVG(technical_score) FROM interview_telemetry WHERE hire_verdict = \'selected\' GROUP BY student_id;',
    solution_criteria: ['Add index on hire_verdict', 'Run EXPLAIN (ANALYZE, BUFFERS)', 'Verify execution time < 15ms'],
    estimated_time: '30 mins',
    skills_boosted: ['PostgreSQL', 'Performance Tuning']
  }
];

/**
 * Get personalized learning roadmap for current student
 * GET /api/v1/learning/roadmap
 */
const getRoadmap = async (req, res) => {
  try {
    const studentId = req.user ? (req.user.student_id || 'f-s1') : 'f-s1';
    let roadmaps = memoryStore.roadmaps.filter(r => r.student_id === studentId);

    if (roadmaps.length === 0) {
      // Create a default roadmap targeted at top gap
      const newRoadmap = {
        id: `rm-${Date.now()}`,
        student_id: studentId,
        skill_id: 'sk-cloud-docker',
        skill_name: 'Docker Containerization & Microservices',
        total_modules: 5,
        completed_modules: 2,
        progress_percentage: 40,
        status: 'in_progress',
        modules: [
          { module_id: 1, title: 'Linux Namespaces & Cgroups Fundamentals', completed: true },
          { module_id: 2, title: 'Dockerfile Directives & Layer Caching', completed: true },
          { module_id: 3, title: 'Docker Compose & Multi-Container Networking', completed: false },
          { module_id: 4, title: 'Kubernetes Pods, Services & ConfigMaps', completed: false },
          { module_id: 5, title: 'Cap-Stone Microservice Deployment with CI/CD', completed: false }
        ]
      };
      memoryStore.roadmaps.push(newRoadmap);
      roadmaps = [newRoadmap];
    }

    res.json({
      success: true,
      count: roadmaps.length,
      data: roadmaps[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve roadmap', error: err.message });
  }
};

/**
 * Update roadmap module progress
 * POST /api/v1/learning/roadmap/progress
 */
const updateProgress = async (req, res) => {
  try {
    const studentId = req.user ? (req.user.student_id || 'f-s1') : 'f-s1';
    const { module_id, completed } = req.body;

    const roadmap = memoryStore.roadmaps.find(r => r.student_id === studentId);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found for student' });
    }

    const mod = roadmap.modules.find(m => m.module_id === parseInt(module_id, 10));
    if (mod) {
      mod.completed = completed !== undefined ? completed : true;
    }

    const completedCount = roadmap.modules.filter(m => m.completed).length;
    roadmap.completed_modules = completedCount;
    roadmap.progress_percentage = Math.round((completedCount / roadmap.total_modules) * 100);

    if (roadmap.progress_percentage === 100) {
      roadmap.status = 'completed';
    }

    // Boost student readiness slightly as they advance
    const student = memoryStore.students.find(s => s.id === studentId);
    if (student && completed) {
      student.overall_readiness = Math.min(99, (student.overall_readiness || 78) + 2);
      student.radar_cloud = Math.min(95, (student.radar_cloud || 42) + 5);
    }

    res.json({
      success: true,
      message: `Module ${module_id} marked as ${mod && mod.completed ? 'completed' : 'pending'}`,
      updated_progress: roadmap.progress_percentage,
      data: roadmap
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update progress', error: err.message });
  }
};

/**
 * Get virtual sandbox labs
 * GET /api/v1/learning/sandbox-labs
 */
const getSandboxLabs = async (req, res) => {
  try {
    res.json({
      success: true,
      count: SANDBOX_LABS.length,
      data: SANDBOX_LABS
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve sandbox labs', error: err.message });
  }
};

/**
 * Book 1-on-1 mentorship session with faculty or industry expert
 * POST /api/v1/learning/mentor/book
 */
const bookMentorSession = async (req, res) => {
  try {
    const studentId = req.user ? (req.user.student_id || 'f-s1') : 'f-s1';
    const { faculty_id, topic, preferred_slot } = req.body;

    const faculty = memoryStore.faculty.find(f => f.id === faculty_id) || memoryStore.faculty[0];

    const booking = {
      id: `bk-${Date.now()}`,
      student_id: studentId,
      faculty_id: faculty.id,
      faculty_name: faculty.name,
      faculty_designation: faculty.designation,
      topic: topic || 'System Architecture & Microservices Code Review',
      scheduled_slot: preferred_slot || 'Tomorrow, 4:00 PM - 5:00 PM IST',
      status: 'confirmed',
      meeting_link: 'https://meet.skillbridge.edu/session-' + Date.now().toString(36)
    };

    res.status(201).json({
      success: true,
      message: `Mentorship session successfully booked with ${faculty.name}`,
      data: booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to book mentor session', error: err.message });
  }
};

module.exports = {
  getRoadmap,
  updateProgress,
  getSandboxLabs,
  bookMentorSession
};
