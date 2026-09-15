/**
 * =============================================================================
 * SkillBridge Core API Server
 * Smart India Hackathon (SIH 2026) - Problem Statement ID: SIH26044
 * Technology Stack: Node.js, Express.js, PostgreSQL
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { isPostgresConnected } = require('./config/database');

// Import Route Handlers
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const skillRoutes = require('./routes/skillRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const eventRoutes = require('./routes/eventRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const learningRoutes = require('./routes/learningRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Robust CORS Configuration for local frontend & dev servers
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins (localhost, 127.0.0.1, file://, dev servers)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-demo-role',
    'x-user-id'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SkillBridge Backend API Engine',
    version: '2.4.0',
    postgres_connected: isPostgresConnected(),
    database_mode: isPostgresConnected() ? 'PostgreSQL Production Cluster' : 'High-Availability In-Memory Engine',
    problem_statement: 'SIH26044 - Automated Industry Alignment Platform'
  });
});

// API Root Information
app.get('/', (req, res) => {
  res.json({
    project: 'SkillBridge Engine',
    slogan: 'Bridging Academia with Industry Demand via Weighted Vector Skill Equivalence (WVSE-v2)',
    documentation: '/api/v1',
    endpoints: {
      health: 'GET /api/health',
      students: '/api/v1/students',
      companies: '/api/v1/companies',
      institutions: '/api/v1/institutions',
      skills: '/api/v1/skills',
      internships: '/api/v1/internships',
      events: '/api/v1/events',
      matching: '/api/v1/matching',
      analytics: '/api/v1/analytics',
      learning: '/api/v1/learning'
    }
  });
});

// Mount All Domain Routes under /api/v1
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/institutions', institutionRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/internships', internshipRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/learning', learningRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found. Verify documentation at GET /`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 [Unhandled Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Start Server if not imported by test suite
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('===========================================================');
    console.log(`🚀 SkillBridge Backend API Server running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💾 Database Engine: ${isPostgresConnected() ? 'Live PostgreSQL' : 'Fallback High-Availability In-Memory Store'}`);
    console.log('===========================================================');
  });
}

module.exports = app;
