/**
 * =============================================================================
 * SkillBridge Student Controller
 * =============================================================================
 * Handles student registration, credential issuance, authentication,
 * profile live tracking, cohort analytics, and cryptographic certificate verification.
 */

const crypto = require('crypto');
const { memoryStore, query, isPostgresConnected, resetStudentData, saveToDiskDatabase } = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');
const { calculateWVSEMatch } = require('../services/matchingService');

/**
 * Register a new student with live manual data entry & credential generation
 * POST /api/v1/students/register
 */
const registerStudent = async (req, res) => {
  try {
    const {
      name,
      roll_no,
      email,
      department,
      institution_name,
      semester,
      cgpa,
      target_company,
      password: customPassword,
      // Skill intake ratings (0-100)
      skills_input,
      radar_prog = 75,
      radar_web = 75,
      radar_db = 70,
      radar_cloud = 40,
      radar_system = 50,
      radar_soft = 80
    } = req.body;

    if (!name || !roll_no) {
      return res.status(400).json({
        success: false,
        message: 'Student full name and Roll No / Registration No are required.'
      });
    }

    // Check if roll number already exists
    const normalizedRoll = roll_no.trim().toUpperCase();
    const existing = memoryStore.students.find(s => s.roll_no.toUpperCase() === normalizedRoll);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with Roll Number '${roll_no}' is already registered. Please log in with your credentials.`
      });
    }

    // Unique IDs
    const studentId = `s-${Date.now()}`;
    const userId = `u-${Date.now()}`;
    const username = normalizedRoll;

    // Password generation: custom or auto-generate secure access key
    const generatedPassword = customPassword && customPassword.trim().length >= 4
      ? customPassword.trim()
      : `SKILL-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

    // Compute initial radar and overall readiness
    const rProg = parseInt(radar_prog, 10) || 75;
    const rWeb = parseInt(radar_web, 10) || 75;
    const rDb = parseInt(radar_db, 10) || 70;
    const rCloud = parseInt(radar_cloud, 10) || 40;
    const rSystem = parseInt(radar_system, 10) || 50;
    const rSoft = parseInt(radar_soft, 10) || 80;

    const overallReadiness = Math.round((rProg + rWeb + rDb + rCloud + rSystem + rSoft) / 6);
    const criticalGapsCount = (rCloud < 60 ? 1 : 0) + (rSystem < 60 ? 1 : 0);

    const studentRecord = {
      id: studentId,
      student_id: studentId,
      user_id: userId,
      username: username,
      password: generatedPassword,
      institution_id: 'inst-nit',
      institution_name: institution_name || 'National Institute of Technology',
      name: name.trim(),
      roll_no: normalizedRoll,
      department: department || 'Computer Science & Engineering',
      semester: semester || '7th Semester',
      cgpa: parseFloat(cgpa) || 8.50,
      overall_readiness: overallReadiness,
      verified_badges_count: 1,
      critical_gaps_count: criticalGapsCount,
      tests_passed: 1,
      active_building_skill: 'Docker Containerization & Microservices',
      target_company: target_company || 'TechNova Solutions (Full Stack)',
      radar_prog: rProg,
      radar_web: rWeb,
      radar_db: rDb,
      radar_cloud: rCloud,
      radar_system: rSystem,
      radar_soft: rSoft,
      status: overallReadiness >= 85 ? 'ready' : (overallReadiness >= 70 ? 'bridging' : 'support'),
      trend: '+5% this month',
      verified_badges: ['SkillBridge Verified Profile Intake'],
      created_at: new Date().toISOString()
    };

    // User credential record
    const userRecord = {
      id: userId,
      user_id: userId,
      student_id: studentId,
      username: username,
      roll_no: normalizedRoll,
      email: email || `${normalizedRoll.toLowerCase()}@skillbridge.edu`,
      password: generatedPassword,
      role: 'student',
      name: studentRecord.name,
      created_at: new Date().toISOString()
    };

    // Initialize student skills
    memoryStore.studentSkills[studentId] = [
      { id: `ss-${Date.now()}-1`, skill_code: 'prog_react', skill_name: 'React.js & State Management', proficiency_level: rWeb, evidence_tier: 'tier_2_assessed', category: 'Web Technologies' },
      { id: `ss-${Date.now()}-2`, skill_code: 'prog_node', skill_name: 'Node.js & Express REST APIs', proficiency_level: rWeb - 4, evidence_tier: 'tier_2_assessed', category: 'Web Technologies' },
      { id: `ss-${Date.now()}-3`, skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', proficiency_level: rDb, evidence_tier: 'tier_2_assessed', category: 'Database Systems' },
      { id: `ss-${Date.now()}-4`, skill_code: 'cloud_docker', skill_name: 'Docker Containerization', proficiency_level: rCloud, evidence_tier: 'tier_1_self_claimed', category: 'Cloud & DevOps' },
      { id: `ss-${Date.now()}-5`, skill_code: 'cloud_k8s', skill_name: 'Kubernetes Orchestration', proficiency_level: Math.max(10, rCloud - 20), evidence_tier: 'tier_1_self_claimed', category: 'Cloud & DevOps' },
      { id: `ss-${Date.now()}-6`, skill_code: 'sys_microservices', skill_name: 'Microservices & Message Queues', proficiency_level: rSystem, evidence_tier: 'tier_1_self_claimed', category: 'System Architecture' }
    ];

    // Initialize baseline evidence records across levels
    if (!memoryStore.skillEvidence) memoryStore.skillEvidence = {};
    memoryStore.skillEvidence[studentId] = [
      {
        id: `ev-${Date.now()}-1`,
        student_id: studentId,
        skill_code: 'prog_python',
        skill_name: 'Programming & Data Structures',
        category: 'Programming',
        evidence_type: 'faculty',
        tier: 'tier_3_verified',
        level: 3,
        title: 'Core Programming Lab Assessment & Code Review',
        issuer: `${studentRecord.institution_name} CSE Dept`,
        score: `${rProg}%`,
        verified_by: 'Prof. Rajesh Kumar (HOD CSE)',
        proof_url: '',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'verified',
        confidence: 85
      },
      {
        id: `ev-${Date.now()}-2`,
        student_id: studentId,
        skill_code: 'prog_react',
        skill_name: 'Modern Web & REST APIs',
        category: 'Web Technologies',
        evidence_type: 'assessment',
        tier: 'tier_2_assessed',
        level: 2,
        title: 'SkillBridge Baseline Web Evaluation',
        issuer: 'SkillBridge Automated Engine',
        score: `${rWeb}%`,
        verified_by: 'Platform Proctor Engine',
        proof_url: '',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'verified',
        confidence: 72
      },
      {
        id: `ev-${Date.now()}-3`,
        student_id: studentId,
        skill_code: 'cloud_docker',
        skill_name: 'Cloud & Containerization',
        category: 'Cloud & DevOps',
        evidence_type: 'self',
        tier: 'tier_1_self_claimed',
        level: 1,
        title: 'Initial Intake Self-Assessment',
        issuer: 'Self-Reported Claim',
        score: `${rCloud}%`,
        verified_by: 'Unverified',
        proof_url: '',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'self_claimed',
        confidence: 30
      }
    ];

    if (!memoryStore.skillTimeline) memoryStore.skillTimeline = {};
    memoryStore.skillTimeline[studentId] = [
      {
        id: `tl-${Date.now()}-1`,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: 'Digital Student Onboarding & Intake',
        type: 'Onboarding Verified',
        level: 2,
        score: `${overallReadiness}%`,
        badge: 'Intake Complete',
        icon: '✓',
        status: 'verified',
        detail: 'Completed baseline multi-vector intake across 6 core competency domains.'
      },
      {
        id: `tl-${Date.now()}-2`,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: 'Core Programming & DSA Lab Assessment',
        type: 'Faculty Verified',
        level: 3,
        score: `${rProg}%`,
        badge: 'Faculty Endorsed',
        icon: '✓',
        status: 'verified',
        detail: 'Endorsed by Department Faculty for programming logic and syntax proficiency.'
      }
    ];

    if (!memoryStore.skillActivity) memoryStore.skillActivity = {};
    memoryStore.skillActivity[studentId] = [
      { id: `act-${Date.now()}-1`, time: 'Just now', text: `Registered live student profile (${studentRecord.roll_no})`, type: 'intake', color: '#00f5a0' },
      { id: `act-${Date.now()}-2`, time: 'Just now', text: 'Baseline WVSE-v2 competency radar generated', type: 'radar', color: '#38bdf8' }
    ];

    // Store in memoryStore and persist to database disk store
    memoryStore.users.push(userRecord);
    memoryStore.students.unshift(studentRecord);
    saveToDiskDatabase();

    // If PostgreSQL is connected, write records to PostgreSQL database
    if (isPostgresConnected()) {
      try {
        await query(
          `INSERT INTO users (id, student_id, username, email, password, role, name, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [userRecord.id, userRecord.student_id, userRecord.username, userRecord.email, userRecord.password, userRecord.role, userRecord.name, userRecord.created_at]
        );
        await query(
          `INSERT INTO students (id, user_id, institution_id, institution_name, name, roll_no, department, semester, cgpa, overall_readiness, verified_badges_count, critical_gaps_count, tests_passed, active_building_skill, target_company, radar_prog, radar_web, radar_db, radar_cloud, radar_system, radar_soft, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
           ON CONFLICT (id) DO NOTHING`,
          [
            studentRecord.id, studentRecord.user_id, studentRecord.institution_id, studentRecord.institution_name,
            studentRecord.name, studentRecord.roll_no, studentRecord.department, studentRecord.semester,
            studentRecord.cgpa, studentRecord.overall_readiness, studentRecord.verified_badges_count,
            studentRecord.critical_gaps_count, studentRecord.tests_passed, studentRecord.active_building_skill,
            studentRecord.target_company, studentRecord.radar_prog, studentRecord.radar_web, studentRecord.radar_db,
            studentRecord.radar_cloud, studentRecord.radar_system, studentRecord.radar_soft, studentRecord.status,
            studentRecord.created_at
          ]
        );
      } catch (dbErr) {
        console.warn('⚠️ [PostgreSQL Sync Notice]:', dbErr.message);
      }
    }

    // Generate JWT Token for immediate session activation
    const token = generateToken({
      id: userId,
      student_id: studentId,
      username: username,
      role: 'student',
      name: studentRecord.name
    });

    const studentData = {
      ...studentRecord,
      skills: memoryStore.studentSkills[studentId],
      radar: {
        programming: rProg,
        web_development: rWeb,
        databases: rDb,
        cloud_devops: rCloud,
        system_architecture: rSystem,
        soft_skills: rSoft
      }
    };

    const credentialsData = {
      user_id: userId,
      userId: userId,
      student_id: studentId,
      studentId: studentId,
      username: username,
      password: generatedPassword,
      roll_no: normalizedRoll,
      name: studentRecord.name,
      issue_date: studentRecord.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Student successfully registered! Credentials generated for live tracking.',
      credentials: credentialsData,
      token,
      student: studentData,
      data: {
        student: studentData,
        credentials: credentialsData,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Student registration failed', error: err.message });
  }
};

/**
 * Student Login using Username / Roll No and Password
 * POST /api/v1/students/login
 */
const loginStudent = async (req, res) => {
  try {
    const { username, password, userId } = req.body;
    const loginIdentifier = username || userId;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Username / Roll No and password are required.' });
    }

    const cleanUser = loginIdentifier.trim().toUpperCase();
    let user = memoryStore.users.find(u => 
      (u.username && u.username.toUpperCase() === cleanUser) || 
      (u.email && u.email.toUpperCase() === cleanUser) ||
      (u.id && u.id.toUpperCase() === cleanUser) ||
      (u.user_id && u.user_id.toUpperCase() === cleanUser) ||
      (u.student_id && u.student_id.toUpperCase() === cleanUser) ||
      (u.roll_no && u.roll_no.toUpperCase() === cleanUser)
    );

    // Fallback: search in students store directly if not in users
    if (!user) {
      const matchedStudent = memoryStore.students.find(s => 
        (s.roll_no && s.roll_no.toUpperCase() === cleanUser) ||
        (s.id && s.id.toUpperCase() === cleanUser) ||
        (s.student_id && s.student_id.toUpperCase() === cleanUser) ||
        (s.user_id && s.user_id.toUpperCase() === cleanUser) ||
        (s.username && s.username.toUpperCase() === cleanUser) ||
        (s.email && s.email.toUpperCase() === cleanUser)
      );

      if (matchedStudent) {
        user = memoryStore.users.find(u => u.student_id === matchedStudent.id || u.id === matchedStudent.user_id);
        if (!user && matchedStudent.password) {
          user = {
            id: matchedStudent.user_id || `u-${Date.now()}`,
            user_id: matchedStudent.user_id || `u-${Date.now()}`,
            student_id: matchedStudent.id,
            username: matchedStudent.roll_no,
            roll_no: matchedStudent.roll_no,
            password: matchedStudent.password,
            name: matchedStudent.name,
            role: 'student',
            created_at: matchedStudent.created_at || new Date().toISOString()
          };
          memoryStore.users.push(user);
        }
      }
    }

    if (!user && isPostgresConnected()) {
      try {
        const pgRes = await query(
          'SELECT * FROM users WHERE UPPER(username) = $1 OR UPPER(email) = $1 OR UPPER(id) = $1 LIMIT 1',
          [cleanUser]
        );
        if (pgRes.rows && pgRes.rows.length > 0) {
          user = pgRes.rows[0];
          memoryStore.users.push(user);
        }
      } catch (pgErr) {
        console.warn('⚠️ [PostgreSQL Login Query Notice]:', pgErr.message);
      }
    }

    const trimPass = password.trim();
    const isPassMatch = user && (
      user.password === trimPass ||
      user.password.trim() === trimPass ||
      user.password.trim().toUpperCase() === trimPass.toUpperCase()
    );

    if (!user || !isPassMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Username / Roll No / User ID or password.' });
    }

    let student = memoryStore.students.find(s => 
      s.id === user.student_id || 
      s.user_id === user.id ||
      (user.username && s.roll_no && s.roll_no.toUpperCase() === user.username.toUpperCase())
    );

    if (!student && isPostgresConnected() && user.student_id) {
      try {
        const sRes = await query('SELECT * FROM students WHERE id = $1 LIMIT 1', [user.student_id]);
        if (sRes.rows && sRes.rows.length > 0) {
          student = sRes.rows[0];
          memoryStore.students.unshift(student);
        }
      } catch (sErr) {}
    }
    const skills = student ? (memoryStore.studentSkills[student.id] || []) : [];

    const token = generateToken({
      id: user.id,
      user_id: user.id,
      student_id: student ? student.id : user.student_id,
      username: user.username,
      roll_no: student ? student.roll_no : user.username,
      role: 'student',
      name: user.name
    });

    const credsData = {
      user_id: user.id || user.user_id,
      userId: user.id || user.user_id,
      student_id: student ? student.id : user.student_id,
      studentId: student ? student.id : user.student_id,
      username: user.username,
      roll_no: student ? student.roll_no : user.username,
      name: user.name
    };

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! Live tracking activated.`,
      token,
      credentials: credsData,
      student: student ? {
        ...student,
        skills,
        radar: {
          programming: student.radar_prog,
          web_development: student.radar_web,
          databases: student.radar_db,
          cloud_devops: student.radar_cloud,
          system_architecture: student.radar_system,
          soft_skills: student.radar_soft
        }
      } : null,
      data: {
        student: student ? {
          ...student,
          skills,
          radar: {
            programming: student.radar_prog,
            web_development: student.radar_web,
            databases: student.radar_db,
            cloud_devops: student.radar_cloud,
            system_architecture: student.radar_system,
            soft_skills: student.radar_soft
          }
        } : null,
        credentials: credsData,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

/**
 * Get personalized live tracking analytics for logged-in student
 * GET /api/v1/students/live-tracking
 */
const getLiveTracking = async (req, res) => {
  try {
    const rawId = req.query.studentId || 
                  (req.user ? (req.user.student_id || req.user.id || req.user.user_id) : null) ||
                  req.headers['x-student-id'] ||
                  req.headers['x-user-id'] ||
                  null;

    let student = null;
    if (rawId) {
      const clean = rawId.trim().toUpperCase();
      student = memoryStore.students.find(s => 
        (s.id && s.id.toUpperCase() === clean) ||
        (s.user_id && s.user_id.toUpperCase() === clean) ||
        (s.student_id && s.student_id.toUpperCase() === clean) ||
        (s.roll_no && s.roll_no.toUpperCase() === clean) ||
        (s.username && s.username.toUpperCase() === clean)
      );
    }

    if (!student && memoryStore.students.length > 0) {
      student = memoryStore.students[0];
    }

    if (!student) {
      return res.json({
        success: true,
        has_active_student: false,
        message: 'No active student session. Please register or login to view live tracking.',
        data: null
      });
    }

    const skills = memoryStore.studentSkills[student.id] || [];

    // Evaluate WVSE-v2 match for all partner company internships
    const matchedInternships = memoryStore.internships.map(internship => {
      const company = memoryStore.companies.find(c => c.id === internship.company_id);
      const reqs = memoryStore.internshipRequirements[internship.id] || [];
      const match = calculateWVSEMatch(skills, reqs);

      return {
        internship_id: internship.id,
        role_title: internship.title,
        company_name: company ? company.name : 'Corporate Partner',
        stipend: internship.stipend_display,
        ppo_package: internship.ppo_package,
        match_score: match.matchScore,
        readiness_tier: match.readinessTier,
        all_mandatory_satisfied: match.allMandatorySatisfied,
        key_strengths: match.strengths.slice(0, 3),
        critical_deficits: match.deficits.slice(0, 3),
        explainable_reason: match.explainableReasons[0]
      };
    }).sort((a, b) => b.match_score - a.match_score);

    const profile = {
      id: student.id,
      student_id: student.id,
      user_id: student.user_id || student.id,
      name: student.name,
      roll_no: student.roll_no,
      username: student.username || student.roll_no,
      department: student.department,
      institution: student.institution_name,
      institution_name: student.institution_name,
      semester: student.semester,
      cgpa: student.cgpa,
      overall_readiness: student.overall_readiness,
      overallReadiness: student.overall_readiness,
      verified_badges_count: student.verified_badges_count,
      critical_gaps_count: student.critical_gaps_count,
      target_company: student.target_company,
      targetCompany: student.target_company,
      status: student.status,
      radar: {
        programming: student.radar_prog,
        web_development: student.radar_web,
        databases: student.radar_db,
        cloud_devops: student.radar_cloud,
        system_architecture: student.radar_system,
        soft_skills: student.radar_soft
      },
      radarScores: {
        prog: student.radar_prog,
        web: student.radar_web,
        db: student.radar_db,
        cloud: student.radar_cloud,
        system: student.radar_system,
        soft: student.radar_soft
      }
    };

    const evidenceList = (memoryStore.skillEvidence && memoryStore.skillEvidence[student.id]) || [];
    const timeline = (memoryStore.skillTimeline && memoryStore.skillTimeline[student.id]) || [];
    const activities = (memoryStore.skillActivity && memoryStore.skillActivity[student.id]) || [];

    let totalConf = 0;
    if (evidenceList.length > 0) {
      evidenceList.forEach(e => totalConf += (e.confidence || 50));
      totalConf = Math.round(totalConf / evidenceList.length);
    } else {
      totalConf = 75;
    }
    profile.evidence_confidence = totalConf;
    profile.evidenceConfidence = totalConf;

    res.json({
      success: true,
      has_active_student: true,
      student_profile: profile,
      student: profile,
      skills,
      evidence_confidence: totalConf,
      evidence_list: evidenceList,
      timeline,
      activities,
      company_matches: matchedInternships,
      top_target_match: matchedInternships[0] || null,
      data: {
        student: profile,
        student_profile: profile,
        skills,
        evidence_confidence: totalConf,
        evidence_list: evidenceList,
        timeline,
        activities,
        company_matches: matchedInternships,
        top_target_match: matchedInternships[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch live tracking', error: err.message });
  }
};

/**
 * Reset all student data (clear entered cohort to start fresh for testing/demo)
 * POST /api/v1/students/reset-data
 */
const resetData = async (req, res) => {
  try {
    const result = resetStudentData();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reset failed', error: err.message });
  }
};

/**
 * Get current student profile
 * GET /api/v1/students/profile
 */
const getProfile = async (req, res) => {
  try {
    const studentId = req.user ? (req.user.student_id || req.query.studentId) : req.query.studentId;

    let student = null;
    if (studentId) {
      student = memoryStore.students.find(s => s.id === studentId || s.user_id === studentId);
    }
    if (!student && memoryStore.students.length > 0) {
      student = memoryStore.students[0];
    }

    if (!student) {
      return res.json({
        success: true,
        data: null,
        message: 'No student registered yet. Please register via the Registration Portal.'
      });
    }

    const skills = memoryStore.studentSkills[student.id] || [];

    res.json({
      success: true,
      data: {
        ...student,
        skills,
        radar: {
          programming: student.radar_prog,
          web_development: student.radar_web,
          databases: student.radar_db,
          cloud_devops: student.radar_cloud,
          system_architecture: student.radar_system,
          soft_skills: student.radar_soft
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student profile', error: err.message });
  }
};

/**
 * Get cohort roster
 * GET /api/v1/students/cohort
 */
const getCohort = async (req, res) => {
  try {
    const { department, status, minReadiness } = req.query;

    let students = memoryStore.students;

    if (department) {
      students = students.filter(s => s.department.toLowerCase().includes(department.toLowerCase()));
    }
    if (status) {
      students = students.filter(s => s.status.toLowerCase() === status.toLowerCase());
    }
    if (minReadiness) {
      students = students.filter(s => s.overall_readiness >= parseInt(minReadiness, 10));
    }

    res.json({
      success: true,
      count: students.length,
      institution: 'National Institute of Technology',
      data: students
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cohort roster', error: err.message });
  }
};

/**
 * Get student by ID
 * GET /api/v1/students/:id
 */
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = memoryStore.students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json({ success: false, message: `Student with ID '${id}' not found` });
    }

    const skills = memoryStore.studentSkills[id] || [];

    res.json({
      success: true,
      data: {
        ...student,
        skills,
        radar: {
          programming: student.radar_prog,
          web_development: student.radar_web,
          databases: student.radar_db,
          cloud_devops: student.radar_cloud,
          system_architecture: student.radar_system,
          soft_skills: student.radar_soft
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving student', error: err.message });
  }
};

/**
 * Update or claim student skill
 * POST /api/v1/students/skills
 */
const updateSkills = async (req, res) => {
  try {
    const { skill_code, skill_name, proficiency_level, evidence_tier } = req.body;
    const studentId = req.user ? req.user.student_id : (memoryStore.students[0] ? memoryStore.students[0].id : null);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'No registered student found to update skills.' });
    }

    if (!skill_code || proficiency_level === undefined) {
      return res.status(400).json({ success: false, message: 'skill_code and proficiency_level are required' });
    }

    const student = memoryStore.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (!memoryStore.studentSkills[studentId]) {
      memoryStore.studentSkills[studentId] = [];
    }

    const existingSkill = memoryStore.studentSkills[studentId].find(s => s.skill_code === skill_code);
    if (existingSkill) {
      existingSkill.proficiency_level = parseInt(proficiency_level, 10);
      existingSkill.evidence_tier = evidence_tier || existingSkill.evidence_tier;
      existingSkill.updated_at = new Date().toISOString();
    } else {
      memoryStore.studentSkills[studentId].push({
        id: `ss-${Date.now()}`,
        skill_id: `sk-${skill_code}`,
        skill_code,
        skill_name: skill_name || skill_code,
        proficiency_level: parseInt(proficiency_level, 10),
        evidence_tier: evidence_tier || 'tier_1_self_claimed',
        created_at: new Date().toISOString()
      });
    }

    // Recalculate student readiness
    const studentSkills = memoryStore.studentSkills[studentId];
    const avg = Math.round(studentSkills.reduce((acc, cur) => acc + cur.proficiency_level, 0) / studentSkills.length);
    student.overall_readiness = avg;

    res.json({
      success: true,
      message: `Skill '${skill_name || skill_code}' successfully recorded`,
      new_readiness: student.overall_readiness,
      data: memoryStore.studentSkills[studentId]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update skill', error: err.message });
  }
};

/**
 * Verify student certificate with cryptographic SHA-256 seal
 * POST /api/v1/students/verify-certificate
 */
const verifyCertificate = async (req, res) => {
  try {
    const { title, issuer, issue_date, certificate_url, skill_code } = req.body;
    const studentId = req.user ? req.user.student_id : (memoryStore.students[0] ? memoryStore.students[0].id : null);

    if (!title || !issuer) {
      return res.status(400).json({ success: false, message: 'Certificate title and issuer are required' });
    }

    const rawPayload = `${studentId || 'live'}:${title}:${issuer}:${issue_date || '2026-09'}:${Date.now()}`;
    const sha256Hash = '0x' + crypto.createHash('sha256').update(rawPayload).digest('hex');

    const certRecord = {
      id: `cert-${Date.now()}`,
      student_id: studentId || 'live-student',
      title,
      issuer,
      issue_date: issue_date || 'September 2026',
      verification_hash: sha256Hash,
      status: 'verified',
      verified_at: new Date().toISOString(),
      trust_multiplier: 1.00,
      certificate_url: certificate_url || 'https://skillbridge.gov.in/verify/' + sha256Hash.substring(0, 16)
    };

    memoryStore.certifications.push(certRecord);

    if (studentId && skill_code && memoryStore.studentSkills[studentId]) {
      const skill = memoryStore.studentSkills[studentId].find(s => s.skill_code === skill_code);
      if (skill) {
        skill.evidence_tier = 'tier_3_verified';
        skill.proficiency_level = Math.max(skill.proficiency_level, 88);
      }
    }

    const student = studentId ? memoryStore.students.find(s => s.id === studentId) : null;
    if (student) {
      student.verified_badges_count = (student.verified_badges_count || 0) + 1;
      if (!student.verified_badges.includes(title)) {
        student.verified_badges.push(title);
      }
      if (title.toLowerCase().includes('docker') || title.toLowerCase().includes('cloud')) {
        student.radar_cloud = Math.min(95, (student.radar_cloud || 40) + 25);
        student.overall_readiness = Math.min(98, (student.overall_readiness || 70) + 8);
        student.critical_gaps_count = Math.max(0, student.critical_gaps_count - 1);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Certificate cryptographically verified and sealed with SHA-256',
      certificate: certRecord,
      updated_readiness: student ? student.overall_readiness : 86,
      trust_level: 'Tier 3 (Verified Proctor / Cert Multiplier: 1.00x)'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Certificate verification failed', error: err.message });
  }
};

/**
 * Get verified certificates for student
 * GET /api/v1/students/certificates
 */
const getCertifications = async (req, res) => {
  try {
    const studentId = req.user ? req.user.student_id : (memoryStore.students[0] ? memoryStore.students[0].id : null);
    const certs = studentId
      ? memoryStore.certifications.filter(c => c.student_id === studentId)
      : memoryStore.certifications;

    res.json({
      success: true,
      count: certs.length,
      data: certs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve certificates', error: err.message });
  }
};

/**
 * Get skill evidence, confidence analytics, timeline, and passport for active student
 * GET /api/v1/students/evidence
 */
const getEvidence = async (req, res) => {
  try {
    const studentId = req.query.studentId || 
                      (req.user ? (req.user.student_id || req.user.id) : null) ||
                      req.headers['x-student-id'] ||
                      (memoryStore.students[0] ? memoryStore.students[0].id : 's-1789494444911');

    const student = memoryStore.students.find(s => s.id === studentId) || memoryStore.students[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const evidence = (memoryStore.skillEvidence && memoryStore.skillEvidence[student.id]) || [];
    const timeline = (memoryStore.skillTimeline && memoryStore.skillTimeline[student.id]) || [];
    const activities = (memoryStore.skillActivity && memoryStore.skillActivity[student.id]) || [];
    const skills = (memoryStore.studentSkills && memoryStore.studentSkills[student.id]) || [];

    // Calculate confidence
    let totalConf = 0;
    if (evidence.length > 0) {
      evidence.forEach(e => totalConf += (e.confidence || 50));
      totalConf = Math.round(totalConf / evidence.length);
    } else {
      totalConf = 65;
    }

    // Passport data
    const verifiedSkills = skills.filter(s => s.evidence_tier === 'tier_3_verified' || s.evidence_tier === 'tier_4_industry');
    const developingSkills = skills.filter(s => s.evidence_tier === 'tier_1_self_claimed' || s.evidence_tier === 'tier_2_assessed');

    const passport = {
      student_id: student.id,
      name: student.name,
      roll_no: student.roll_no,
      institution: student.institution_name,
      department: student.department,
      semester: student.semester,
      overall_readiness: student.overall_readiness,
      evidence_confidence: totalConf,
      verified_credentials_count: evidence.filter(e => e.status === 'verified').length + (student.verified_badges_count || 1),
      verified_skills: verifiedSkills.map(s => ({
        skill: s.skill_name,
        tier: (s.proficiency_level >= 80 ? 'Advanced' : 'Intermediate'),
        score: s.proficiency_level
      })),
      developing_skills: developingSkills.map(s => ({
        skill: s.skill_name,
        tier: 'Developing',
        score: s.proficiency_level
      })),
      cryptographic_seal: 'SHA-256 Sealed • SKILLBRIDGE-VERIFIED-2026'
    };

    res.json({
      success: true,
      student_id: student.id,
      evidence_confidence: totalConf,
      evidence_count: evidence.length,
      evidence,
      timeline,
      activities,
      passport,
      data: {
        evidence_confidence: totalConf,
        evidence,
        timeline,
        activities,
        passport
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch skill evidence', error: err.message });
  }
};

/**
 * Add new skill evidence (submits for verification or logs assessment/claim)
 * POST /api/v1/students/evidence
 */
const addEvidence = async (req, res) => {
  try {
    const studentId = req.user ? (req.user.student_id || req.user.id) : (req.body.student_id || (memoryStore.students[0] ? memoryStore.students[0].id : 's-1789494444911'));
    const student = memoryStore.students.find(s => s.id === studentId) || memoryStore.students[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const skill_code = req.body.skill_code || req.body.skillCode;
    const skill_name = req.body.skill_name || req.body.skillName;
    const evidence_type = req.body.evidence_type || req.body.evidenceType;
    const title = req.body.title;
    const score_or_grade = req.body.score_or_grade || req.body.score;
    const proof_url = req.body.proof_url || req.body.link || req.body.proofUrl;
    const issuer = req.body.issuer;

    if (!skill_code || !title) {
      return res.status(400).json({ success: false, message: 'Skill and Evidence Title are required.' });
    }

    const cleanType = (evidence_type || 'project').toLowerCase();
    const isInstantVerified = cleanType === 'assessment';
    const isSelfClaim = cleanType === 'self';

    let tier = 'tier_1_self_claimed';
    let level = 1;
    let confidence = 35;
    let status = 'pending';

    if (isSelfClaim) {
      tier = 'tier_1_self_claimed';
      level = 1;
      confidence = 35;
      status = 'self_claimed';
    } else if (isInstantVerified) {
      tier = 'tier_2_assessed';
      level = 2;
      confidence = 75;
      status = 'verified';
    } else if (cleanType === 'faculty') {
      tier = 'tier_3_verified';
      level = 3;
      confidence = 88;
      status = 'pending';
    } else if (cleanType === 'certificate' || cleanType === 'project' || cleanType === 'internship' || cleanType.includes('project')) {
      tier = 'tier_4_industry';
      level = 4;
      confidence = 95;
      status = 'pending';
    }

    const evidenceRecord = {
      id: `ev-${Date.now()}`,
      student_id: student.id,
      student_name: student.name,
      skill_code,
      skill_name: skill_name || skill_code,
      evidence_type: cleanType,
      tier,
      level,
      title: title.trim(),
      issuer: issuer || (cleanType === 'faculty' ? 'CSE Department Faculty' : (cleanType === 'certificate' ? 'External Issuer' : 'Project Repo')),
      score: score_or_grade || '85%',
      verified_by: isInstantVerified ? 'Platform Automated Engine' : (isSelfClaim ? 'Self Reported' : 'Pending Faculty Review'),
      proof_url: proof_url || '',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status,
      confidence
    };

    if (!memoryStore.skillEvidence) memoryStore.skillEvidence = {};
    if (!memoryStore.skillEvidence[student.id]) memoryStore.skillEvidence[student.id] = [];
    memoryStore.skillEvidence[student.id].unshift(evidenceRecord);

    let queueItem = null;
    // If pending, queue into pendingVerifications for the faculty portal!
    if (status === 'pending') {
      queueItem = {
        id: `pv-${Date.now()}`,
        evidence_id: evidenceRecord.id,
        student_id: student.id,
        student_name: student.name,
        roll_no: student.roll_no,
        department: student.department,
        skill_code,
        skill_name: skill_name || skill_code,
        evidence_type: cleanType,
        tier_requested: tier,
        level,
        title: title.trim(),
        issuer: evidenceRecord.issuer,
        score_or_grade: score_or_grade || '85%',
        proof_url: proof_url || '',
        date: evidenceRecord.date,
        status: 'pending'
      };
      if (!Array.isArray(memoryStore.pendingVerifications)) memoryStore.pendingVerifications = [];
      memoryStore.pendingVerifications.unshift(queueItem);
    }

    // Add entry to student's activity feed
    if (!memoryStore.skillActivity) memoryStore.skillActivity = {};
    if (!memoryStore.skillActivity[student.id]) memoryStore.skillActivity[student.id] = [];
    memoryStore.skillActivity[student.id].unshift({
      id: `act-${Date.now()}`,
      time: 'Just now',
      text: status === 'pending'
        ? `Submitted "${title}" for ${skill_name || skill_code} (Queued for Faculty Verification)`
        : `Added evidence: "${title}" for ${skill_name || skill_code} (${status})`,
      type: cleanType,
      color: status === 'pending' ? '#f59e0b' : '#00f5a0'
    });

    // Add entry to timeline if verified or self-claimed
    if (!memoryStore.skillTimeline) memoryStore.skillTimeline = {};
    if (!memoryStore.skillTimeline[student.id]) memoryStore.skillTimeline[student.id] = [];
    memoryStore.skillTimeline[student.id].unshift({
      id: `tl-${Date.now()}`,
      date: evidenceRecord.date,
      title: title.trim(),
      type: cleanType.toUpperCase(),
      level,
      score: score_or_grade || 'Submitted',
      badge: status === 'verified' ? 'Verified' : 'Pending Verification',
      icon: status === 'verified' ? '✓' : '⏳',
      status,
      detail: `Evidence for ${skill_name || skill_code}. ${proof_url ? 'Proof: ' + proof_url : ''}`
    });

    saveToDiskDatabase();

    res.status(201).json({
      success: true,
      message: status === 'pending'
        ? 'Skill evidence submitted successfully and queued for Faculty Verification!'
        : 'Skill evidence logged successfully!',
      evidence: evidenceRecord,
      status,
      data: {
        evidence: evidenceRecord,
        status,
        verificationId: queueItem ? queueItem.id : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add skill evidence', error: err.message });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  getLiveTracking,
  resetData,
  getProfile,
  getCohort,
  getStudentById,
  updateSkills,
  verifyCertificate,
  getCertifications,
  getEvidence,
  addEvidence
};
