/**
 * =============================================================================
 * SkillBridge Automated API Integration Test Suite
 * Smart India Hackathon (SIH 2026) - PS ID: SIH26044
 * =============================================================================
 */

const http = require('http');
const app = require('../server');

// Helper to make local requests to Express app
function makeRequest(server, options, requestData = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port: port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-role': 'student',
        'x-user-id': 'u-student-1',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (requestData) {
      req.write(JSON.stringify(requestData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 =========================================================');
  console.log('🧪 Starting SkillBridge Automated API Test Suite');
  console.log('🧪 =========================================================\n');

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`🌐 Test server listening on port ${port}\n`);

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    await assertTest('GET /api/health returns healthy status', async () => {
      const res = await makeRequest(server, { path: '/api/health' });
      if (res.status !== 200 || res.data.status !== 'healthy') {
        throw new Error(`Expected status 200 & status 'healthy', got ${res.status}`);
      }
    });

    // 2. API Root Info
    await assertTest('GET / returns system information and endpoints', async () => {
      const res = await makeRequest(server, { path: '/' });
      if (res.status !== 200 || !res.data.endpoints) {
        throw new Error(`Expected status 200 with endpoints object, got ${res.status}`);
      }
    });

    // 3. Live Student Registration & Credential Generation
    await assertTest('POST /api/v1/students/register creates student and issues credentials', async () => {
      const regPayload = {
        name: 'Aarav Sharma',
        roll_no: '2024CSE1088',
        institution_name: 'National Institute of Technology',
        department: 'Computer Science & Engineering',
        semester: '7th Semester',
        cgpa: 8.85,
        target_company: 'TechNova Solutions (Full Stack)',
        radar_prog: 85,
        radar_web: 88,
        radar_db: 80,
        radar_cloud: 80,
        radar_system: 78,
        radar_soft: 85
      };
      const res = await makeRequest(server, { path: '/api/v1/students/register', method: 'POST' }, regPayload);
      if (res.status !== 201 || !res.data.data.credentials.username) {
        throw new Error(`Expected registration with credentials, got: ${JSON.stringify(res.data)}`);
      }
    });

    // 4. Student Profile & Radar Metrics
    await assertTest('GET /api/v1/students/profile returns registered student profile with radar metrics', async () => {
      const res = await makeRequest(server, { path: '/api/v1/students/profile' });
      if (res.status !== 200 || !res.data.data.name.includes('Aarav')) {
        throw new Error(`Expected student profile for Aarav, got: ${JSON.stringify(res.data)}`);
      }
      if (!res.data.data.radar || res.data.data.radar.programming === undefined) {
        throw new Error('Radar metrics missing in student profile');
      }
    });

    // 5. Cohort Roster
    await assertTest('GET /api/v1/students/cohort returns active students in NIT cohort', async () => {
      const res = await makeRequest(server, { path: '/api/v1/students/cohort' });
      if (res.status !== 200 || res.data.count < 1) {
        throw new Error(`Expected at least 1 student, got ${res.data.count}`);
      }
      const names = res.data.data.map(s => s.name);
      if (!names.includes('Aarav Sharma')) throw new Error('Missing registered student in cohort');
    });

    // 5. Cryptographic Certificate Verification
    await assertTest('POST /api/v1/students/verify-certificate generates SHA-256 seal & elevates Tier', async () => {
      const payload = {
        title: 'Docker Certified Associate (DCA)',
        issuer: 'Docker Inc. / Linux Foundation',
        issue_date: '2026-09-15',
        skill_code: 'cloud_docker'
      };
      const res = await makeRequest(server, { path: '/api/v1/students/verify-certificate', method: 'POST' }, payload);
      if (res.status !== 201 || !res.data.certificate.verification_hash.startsWith('0x')) {
        throw new Error(`Certificate verification failed: ${JSON.stringify(res.data)}`);
      }
      if (res.data.certificate.trust_multiplier !== 1.0) {
        throw new Error('Trust multiplier should be 1.00 for verified cert');
      }
    });

    // 6. Companies & Candidate Ranking
    await assertTest('GET /api/v1/companies/c-technova/candidates ranks students using WVSE-v2', async () => {
      const res = await makeRequest(server, { path: '/api/v1/companies/c-technova/candidates' });
      if (res.status !== 200 || !res.data.data || res.data.data.length === 0) {
        throw new Error('Candidates list empty');
      }
      // Top candidate should have calibrated match score
      if (res.data.data[0].match_score < 60) {
        throw new Error(`Top candidate score unexpectedly low: ${res.data.data[0].match_score}`);
      }
    });

    // 7. Institution & BoS Proposals
    await assertTest('GET /api/v1/institutions/overview returns NIT Surathkal Dean & Faculty', async () => {
      const res = await makeRequest(server, { path: '/api/v1/institutions/overview' });
      if (res.status !== 200 || !res.data.institution.dean.name.includes('Mukherjee')) {
        throw new Error(`Dean info mismatch: ${JSON.stringify(res.data.institution)}`);
      }
    });

    await assertTest('POST /api/v1/institutions/syllabus-proposals adds new BoS curriculum proposal', async () => {
      const payload = {
        course_code: 'CSE-402',
        title: 'Cloud Native Microservices & Docker Lab',
        proposed_modules: ['Containerization', 'Kubernetes Orchestration', 'Service Mesh'],
        credits: 4,
        deficit_justification: 'Addresses 44% batch deficit in cloud deployments'
      };
      const res = await makeRequest(server, { path: '/api/v1/institutions/syllabus-proposals', method: 'POST' }, payload);
      if (res.status !== 201 || res.data.proposal.course_code !== 'CSE-402') {
        throw new Error(`Proposal submission failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 8. Skills & Quiz Assessment
    await assertTest('GET /api/v1/skills returns categorized competencies', async () => {
      const res = await makeRequest(server, { path: '/api/v1/skills' });
      if (res.status !== 200 || res.data.total_skills < 5) {
        throw new Error('Expected at least 5 core skills');
      }
    });

    await assertTest('POST /api/v1/skills/cloud_docker/assessment evaluates quiz & promotes to Tier 2 Assessed', async () => {
      const payload = { answers: [1, 2, 1, 0] }; // All correct
      const res = await makeRequest(server, { path: '/api/v1/skills/cloud_docker/assessment', method: 'POST' }, payload);
      if (res.status !== 200 || res.data.score !== 100 || !res.data.passed) {
        throw new Error(`Assessment failed to score correctly: ${JSON.stringify(res.data)}`);
      }
    });

    // 9. Internships & Application
    await assertTest('GET /api/v1/internships returns active openings with requirements', async () => {
      const res = await makeRequest(server, { path: '/api/v1/internships' });
      if (res.status !== 200 || res.data.count < 3) {
        throw new Error(`Expected at least 3 internships, got ${res.data.count}`);
      }
    });

    await assertTest('POST /api/v1/internships/i-technova-fs/apply submits student application with WVSE check', async () => {
      const res = await makeRequest(server, { path: '/api/v1/internships/i-technova-fs/apply', method: 'POST' });
      if (res.status !== 201 || !res.data.application || res.data.application.match_score === undefined) {
        throw new Error(`Application failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 10. Events & Sabbaticals
    await assertTest('GET /api/v1/events returns hackathons and faculty sabbaticals', async () => {
      const res = await makeRequest(server, { path: '/api/v1/events' });
      if (res.status !== 200 || res.data.count < 3) {
        throw new Error(`Expected at least 3 events, got ${res.data.count}`);
      }
    });

    // 11. WVSE-v2 Mathematical Matching & Explainable AI
    await assertTest('POST /api/v1/matching/evaluate executes deterministic WVSE-v2 formula', async () => {
      const payload = {
        student_id: 'f-s1',
        internship_id: 'i-technova-fs'
      };
      const res = await makeRequest(server, { path: '/api/v1/matching/evaluate', method: 'POST' }, payload);
      if (res.status !== 200 || res.data.evaluation.matchScore === undefined) {
        throw new Error(`WVSE evaluation failed: ${JSON.stringify(res.data)}`);
      }
    });

    await assertTest('GET /api/v1/matching/explain provides step-by-step mathematical audit trail', async () => {
      const res = await makeRequest(server, { path: '/api/v1/matching/explain?studentId=f-s1&internshipId=i-technova-fs' });
      if (res.status !== 200 || !res.data.step_by_step_audit || !res.data.reasoning_bullets) {
        throw new Error('Explainable AI audit trail missing');
      }
    });

    // 12. Analytics & Market Intelligence
    await assertTest('GET /api/v1/analytics/overview returns platform KPIs & market trends', async () => {
      const res = await makeRequest(server, { path: '/api/v1/analytics/overview' });
      if (res.status !== 200 || !res.data.data.kpis) {
        throw new Error('Platform analytics missing KPIs');
      }
    });

    await assertTest('GET /api/v1/analytics/cohort-gaps returns department-wide curriculum deficit percentages', async () => {
      const res = await makeRequest(server, { path: '/api/v1/analytics/cohort-gaps' });
      if (res.status !== 200 || !res.data.data.skill_analytics) {
        throw new Error('Cohort gap analytics missing');
      }
    });

    // 13. Personalized Learning & Sandbox Labs
    await assertTest('GET /api/v1/learning/roadmap returns personalized bridging pathway', async () => {
      const res = await makeRequest(server, { path: '/api/v1/learning/roadmap' });
      if (res.status !== 200 || !res.data.data.modules) {
        throw new Error('Learning roadmap missing modules');
      }
    });

    await assertTest('GET /api/v1/learning/sandbox-labs returns virtual hands-on coding scenarios', async () => {
      const res = await makeRequest(server, { path: '/api/v1/learning/sandbox-labs' });
      if (res.status !== 200 || res.data.count < 2) {
        throw new Error('Expected at least 2 sandbox labs');
      }
    });

  } finally {
    server.close();
  }

  console.log('\n=========================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('=========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All SkillBridge API endpoints verified and operational!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
