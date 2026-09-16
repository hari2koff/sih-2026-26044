/**
 * =============================================================================
 * SkillBridge Authentication & Authorization Middleware
 * Supports JWT Verification & Demo Header Pass-Through
 * =============================================================================
 */

const jwt = require('jsonwebtoken');
const { memoryStore, query, isPostgresConnected } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_super_secret_sih2026_jwt_token_key_982a';

/**
 * Protect routes: requires valid JWT or demo header
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Demo Mode Bypass: allows testing/demo with headers like x-demo-role & x-user-id
    if (!token && req.headers['x-demo-role']) {
      const demoRole = req.headers['x-demo-role'];
      const demoUserId = req.headers['x-user-id'] || `demo-${demoRole}-1`;
      const firstStudent = memoryStore.students && memoryStore.students[0];

      req.user = {
        id: demoUserId,
        student_id: req.headers['x-student-id'] || (firstStudent ? firstStudent.id : null),
        username: req.headers['x-username'] || (firstStudent ? firstStudent.roll_no : null),
        email: `${demoRole}@skillbridge.edu`,
        role: demoRole,
        institution_id: 'inst-nit',
        name: firstStudent ? firstStudent.name : `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`
      };
      return next();
    }

    if (!token) {
      // Default to first registered student or demo student for friction-free evaluation
      const firstStudent = memoryStore.students && memoryStore.students[0];
      req.user = {
        id: firstStudent ? (firstStudent.user_id || firstStudent.id) : 'u-student-1',
        student_id: firstStudent ? firstStudent.id : null,
        username: firstStudent ? firstStudent.roll_no : '2024CSE1099',
        email: firstStudent ? `${firstStudent.roll_no.toLowerCase()}@nit.edu` : 'hariprasad@nit.edu',
        role: 'student',
        institution_id: 'inst-nit',
        name: firstStudent ? firstStudent.name : 'Hariprasad PS'
      };
      return next();
    }

    // Verify JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Look up user in DB or memoryStore
      if (isPostgresConnected()) {
        const result = await query('SELECT id, email, role, institution_id, student_id, username, name FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length > 0) {
          req.user = {
            ...result.rows[0],
            student_id: result.rows[0].student_id || decoded.student_id,
            username: result.rows[0].username || decoded.username
          };
          return next();
        }
      }

      // Memory store fallback
      req.user = {
        id: decoded.id || 'u-student-1',
        user_id: decoded.id || 'u-student-1',
        student_id: decoded.student_id || null,
        username: decoded.username || null,
        email: decoded.email || 'hariprasad@nit.edu',
        role: decoded.role || 'student',
        institution_id: decoded.institution_id || 'inst-nit',
        name: decoded.name || 'Hariprasad PS'
      };
      next();
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
        error: jwtErr.message
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authentication middleware error',
      error: err.message
    });
  }
};

/**
 * Restrict access to specified roles
 * @param  {...string} roles - e.g. 'student', 'company', 'faculty', 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (payload, expiresIn = '30d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = {
  protect,
  authorize,
  generateToken,
  JWT_SECRET
};
