/**
 * =============================================================================
 * SkillBridge CORS & Frontend-to-Backend Local Integration Test
 * Validates cross-origin requests, pre-flight headers, and live endpoints
 * =============================================================================
 */

const http = require('http');
const app = require('../server');

function makeRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              rawBody: data
            });
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

async function runCorsTests() {
  console.log('🌐 =========================================================');
  console.log('🌐 Testing Frontend-to-Backend CORS & Local Connectivity');
  console.log('🌐 =========================================================\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
      failed++;
    }
  }

  // Test 1: OPTIONS Preflight from localhost:5500 (Live Server)
  await assert('CORS Preflight: OPTIONS request from http://localhost:5500 returns 200/204 & Allow headers', async () => {
    const res = await makeRequest({
      path: '/api/v1/students/skills',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5500',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, x-demo-role'
      }
    });

    if (res.statusCode !== 200 && res.statusCode !== 204) {
      throw new Error(`Expected 200 or 204, got ${res.statusCode}`);
    }
    const originHeader = res.headers['access-control-allow-origin'];
    if (!originHeader) {
      throw new Error('Missing Access-Control-Allow-Origin header');
    }
  });

  // Test 2: GET /api/health with Origin: null (local file:// preview)
  await assert('CORS Local File: GET /api/health from file:// (Origin: null) returns healthy and CORS headers', async () => {
    const res = await makeRequest({
      path: '/api/health',
      method: 'GET',
      headers: {
        'Origin': 'null'
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
    if (!res.headers['access-control-allow-origin']) {
      throw new Error('Missing Access-Control-Allow-Origin for local file preview');
    }
    if (res.body.status !== 'healthy') {
      throw new Error(`Expected status 'healthy', got ${res.body.status}`);
    }
  });

  // Test 3: GET /api/v1/students/profile with Origin: http://localhost:3000 (React / Next.js dev server)
  await assert('CORS Dev Server: GET /api/v1/students/profile from http://localhost:3000 returns profile data', async () => {
    const res = await makeRequest({
      path: '/api/v1/students/profile',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
        'x-demo-role': 'student',
        'x-user-id': 'u-student-1'
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
    if (res.headers['access-control-allow-origin'] !== 'http://localhost:3000') {
      throw new Error(`Expected allow-origin http://localhost:3000, got ${res.headers['access-control-allow-origin']}`);
    }
    if (res.body.success !== true) {
      throw new Error('Expected success: true');
    }
  });

  // Test 4: POST /api/v1/skills/cloud_docker/assessment with Origin: http://127.0.0.1:5500 (VS Code Live Server)
  await assert('CORS Evaluation: POST /api/v1/skills/cloud_docker/assessment from 127.0.0.1:5500 scores quiz', async () => {
    const res = await makeRequest({
      path: '/api/v1/skills/cloud_docker/assessment',
      method: 'POST',
      headers: {
        'Origin': 'http://127.0.0.1:5500',
        'Content-Type': 'application/json'
      },
      body: { answers: [1, 2, 1, 0] }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
    if (!res.body.passed || res.body.score !== 100) {
      throw new Error(`Quiz failed to score 100%: ${JSON.stringify(res.body)}`);
    }
  });

  // Test 5: POST /api/v1/students/verify-certificate with Origin: http://localhost:5173 (Vite dev server)
  await assert('CORS Cryptographic Verification: POST /api/v1/students/verify-certificate generates SHA-256 seal', async () => {
    const res = await makeRequest({
      path: '/api/v1/students/verify-certificate',
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Docker Certified Associate',
        issuer: 'Docker Inc.',
        skill_code: 'cloud_docker'
      }
    });

    if (res.statusCode !== 201) {
      throw new Error(`Expected 201, got ${res.statusCode}`);
    }
    if (!res.body.certificate.verification_hash.startsWith('0x')) {
      throw new Error('Hash was not generated');
    }
    if (res.headers['access-control-allow-origin'] !== 'http://localhost:5173') {
      throw new Error(`CORS origin not returned correctly`);
    }
  });

  // Test 6: POST /api/v1/companies/telemetry from recruiter portal
  await assert('CORS Telemetry: POST /api/v1/companies/telemetry records interviewer scores', async () => {
    const res = await makeRequest({
      path: '/api/v1/companies/telemetry',
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:5500',
        'Content-Type': 'application/json'
      },
      body: {
        student_id: 'f-s1',
        company_id: 'c-technova',
        technical_score: 88,
        feedback_notes: 'Strong core fundamentals. Ready for Kubernetes production sandbox.',
        hire_verdict: 'selected'
      }
    });

    if (res.statusCode !== 201) {
      throw new Error(`Expected 201, got ${res.statusCode}`);
    }
    if (!res.body.success) {
      throw new Error('Telemetry submission failed');
    }
  });

  console.log('\n=========================================================');
  console.log(`🌐 CORS Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('=========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 Full CORS functionality verified across all standard frontend origins!\n');
    process.exit(0);
  }
}

runCorsTests().catch(err => {
  console.error('Fatal error in CORS tests:', err);
  process.exit(1);
});
