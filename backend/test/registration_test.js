/**
 * =============================================================================
 * SkillBridge Student Registration, Credential Generation & Live Tracking Test
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
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
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

async function runRegistrationTests() {
  console.log('🎓 =========================================================');
  console.log('🎓 Testing Live Student Registration & Credential Engine');
  console.log('🎓 =========================================================\n');

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

  // 1. Initial State: Cohort is clean and empty
  await assert('Empty State: GET /api/v1/students/profile returns data: null when cohort is fresh', async () => {
    const res = await makeRequest({ path: '/api/v1/students/profile' });
    if (res.statusCode !== 200 || res.body.data !== null) {
      throw new Error(`Expected status 200 with data: null, got ${JSON.stringify(res.body)}`);
    }
  });

  let issuedCredentials = null;
  let authToken = null;

  // 2. Register Live Student
  await assert('Registration: POST /api/v1/students/register creates student and issues credentials', async () => {
    const payload = {
      name: 'Aarav Sharma',
      roll_no: '2024CSE1099',
      department: 'Computer Science & Engineering',
      institution_name: 'National Institute of Technology',
      semester: '7th Semester',
      cgpa: 8.92,
      target_company: 'TechNova Solutions (Full Stack)',
      radar_prog: 88,
      radar_web: 84,
      radar_db: 80,
      radar_cloud: 42,
      radar_system: 60,
      radar_soft: 86
    };

    const res = await makeRequest({
      path: '/api/v1/students/register',
      method: 'POST',
      body: payload
    });

    if (res.statusCode !== 201) {
      throw new Error(`Expected status 201, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }

    if (!res.body.credentials || !res.body.credentials.username || !res.body.credentials.password) {
      throw new Error('Username or password missing from registration response');
    }

    if (!res.body.token) {
      throw new Error('JWT token missing from registration response');
    }

    issuedCredentials = res.body.credentials;
    authToken = res.body.token;

    console.log(`     🔑 Issued Username: ${issuedCredentials.username}`);
    console.log(`     🔑 Generated Password: ${issuedCredentials.password}`);
    console.log(`     🎯 Overall Readiness: ${res.body.student.overall_readiness}%`);
  });

  // 3. Login with Generated Credentials
  await assert('Login: POST /api/v1/students/login validates issued username and password', async () => {
    const res = await makeRequest({
      path: '/api/v1/students/login',
      method: 'POST',
      body: {
        username: issuedCredentials.username,
        password: issuedCredentials.password
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }

    if (!res.body.token || !res.body.student) {
      throw new Error('Login failed to return token or student profile');
    }
  });

  // 3b. Database Disk Persistence Verification
  await assert('Database Persistence: Student & credentials successfully written to database_store.json', async () => {
    const fs = require('fs');
    const path = require('path');
    const storePath = path.join(__dirname, '..', '..', 'database', 'database_store.json');
    if (!fs.existsSync(storePath)) {
      throw new Error(`database_store.json does not exist at ${storePath}`);
    }
    const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    if (!store.students || !store.students.some(s => s.roll_no === '2024CSE1099')) {
      throw new Error('Registered student missing from persistent database_store.json');
    }
    if (!store.users || !store.users.some(u => u.username === '2024CSE1099')) {
      throw new Error('User credentials missing from persistent database_store.json');
    }
    console.log(`     💾 Persisted Database File verified: ${store.students.length} student record(s) on disk.`);
  });

  // 4. Live Tracking for Logged-In Student
  await assert('Live Tracking: GET /api/v1/students/live-tracking calculates personalized WVSE match', async () => {
    const res = await makeRequest({
      path: '/api/v1/students/live-tracking',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }

    if (!res.body.has_active_student || !res.body.student_profile) {
      throw new Error('Live tracking did not recognize active student');
    }

    if (!res.body.company_matches || res.body.company_matches.length === 0) {
      throw new Error('Company matches not calculated');
    }

    console.log(`     📊 Top Target Role: ${res.body.company_matches[0].role_title}`);
    console.log(`     📊 WVSE-v2 Match Score: ${res.body.company_matches[0].match_score}%`);
  });

  // 5. Cohort Verification
  await assert('Cohort Sync: GET /api/v1/students/cohort now contains the registered live student', async () => {
    const res = await makeRequest({ path: '/api/v1/students/cohort' });
    if (res.statusCode !== 200 || res.body.count !== 1) {
      throw new Error(`Expected count 1, got ${res.body.count}`);
    }
    if (res.body.data[0].name !== 'Aarav Sharma') {
      throw new Error(`Expected student Aarav Sharma, got ${res.body.data[0].name}`);
    }
  });

  // 6. Reset Data Test
  await assert('Clean Slate: POST /api/v1/students/reset-data clears student data back to 0', async () => {
    const res = await makeRequest({
      path: '/api/v1/students/reset-data',
      method: 'POST'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }

    const check = await makeRequest({ path: '/api/v1/students/cohort' });
    if (check.body.count !== 0) {
      throw new Error(`Expected count 0 after reset, got ${check.body.count}`);
    }
  });

  console.log('\n=========================================================');
  console.log(`🎓 Registration Engine Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('=========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 Student Registration & Live Tracking Engine is 100% verified!\n');
    process.exit(0);
  }
}

runRegistrationTests().catch(err => {
  console.error('Fatal error in registration test:', err);
  process.exit(1);
});
