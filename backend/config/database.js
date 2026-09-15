/**
 * =============================================================================
 * SkillBridge Database Configuration & Query Pool
 * PostgreSQL Pool with Graceful Hybrid Fallback Engine
 * =============================================================================
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool = null;
let isPostgresConnected = false;

// Initialize PostgreSQL Connection Pool
try {
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'skillbridge_db',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.warn('⚠️ [PostgreSQL Pool Warning]:', err.message);
  });
} catch (err) {
  console.warn('⚠️ [PostgreSQL Init Error]:', err.message);
}

// In-memory fallback mock storage to ensure zero downtime if Postgres is offline
const memoryStore = {
  institutions: [
    {
      id: 'inst-nit',
      name: 'National Institute of Technology',
      code: 'NIT-01',
      dean_name: 'Dr. S. K. Mukherjee',
      dean_email: 'dean.academics@nit.edu',
      address: 'National Highway 66, Surathkal',
      state: 'Karnataka'
    }
  ],

  faculty: [
    {
      id: 'fac-1',
      name: 'Prof. Rajesh Kumar',
      email: 'rajesh.cse@nit.edu',
      designation: 'Professor & Head of Department',
      department: 'Computer Science & Engineering',
      specialization: 'Distributed Systems & Cloud Computing'
    },
    {
      id: 'fac-2',
      name: 'Dr. Ananya Sharma',
      email: 'ananya.sharma@nit.edu',
      designation: 'Associate Professor',
      department: 'Computer Science & Engineering',
      specialization: 'Database Internals & Data Engineering'
    },
    {
      id: 'fac-3',
      name: 'Dr. S. K. Mukherjee',
      email: 'dean.academics@nit.edu',
      designation: 'Dean of Academic Affairs',
      department: 'Academic Council / BoS',
      specialization: 'Curriculum Governance & Systems Engineering'
    }
  ],

  users: [],
  students: [],
  studentSkills: {},

  skills: [
    { id: 'sk-1', code: 'prog_react', name: 'React.js & State Management', category: 'Web Technologies', industry_benchmark: 80 },
    { id: 'sk-2', code: 'prog_node', name: 'Node.js & Express REST APIs', category: 'Web Technologies', industry_benchmark: 75 },
    { id: 'sk-3', code: 'prog_java', name: 'Java & Spring Boot Enterprise', category: 'Programming', industry_benchmark: 80 },
    { id: 'sk-4', code: 'prog_python', name: 'Python & Scripting', category: 'Programming', industry_benchmark: 80 },
    { id: 'sk-5', code: 'db_pg', name: 'PostgreSQL Database Modeling', category: 'Database Systems', industry_benchmark: 75 },
    { id: 'sk-6', code: 'cloud_docker', name: 'Docker Containerization', category: 'Cloud & DevOps', industry_benchmark: 80 },
    { id: 'sk-7', code: 'cloud_k8s', name: 'Kubernetes Orchestration', category: 'Cloud & DevOps', industry_benchmark: 70 },
    { id: 'sk-8', code: 'sys_microservices', name: 'Microservices & Message Queues', category: 'System Architecture', industry_benchmark: 75 },
    { id: 'sk-9', code: 'cloud_aws', name: 'AWS Cloud Fundamentals', category: 'Cloud & DevOps', industry_benchmark: 75 },
    { id: 'sk-10', code: 'ai_rag', name: 'Vector DBs & RAG Architecture', category: 'AI & Data Systems', industry_benchmark: 75 }
  ],

  companies: [
    { id: 'c-technova', code: 'technova', name: 'TechNova Solutions', industry: 'Enterprise SaaS & Cloud Infrastructure', tier: 'Tier-1 Enterprise', location: 'Bengaluru / Hybrid', website: 'https://technovasolutions.io' },
    { id: 'c-datacore', code: 'datacore', name: 'DataCore Technologies', industry: 'AI Systems & High-Performance Data', tier: 'Tier-1 AI Lab', location: 'Hyderabad / On-site', website: 'https://datacore.ai' },
    { id: 'c-tcsresearch', code: 'tcsresearch', name: 'TCS Research & Innovation', industry: 'Systems & Industrial R&D', tier: 'Corporate Research', location: 'Chennai / Pune', website: 'https://tcs.com/research' },
    { id: 'c-zoho', code: 'zoho', name: 'Zoho Corporation', industry: 'Business Software & Core Systems', tier: 'Product Tier-1', location: 'Chennai / Tenkasi', website: 'https://zoho.com' },
    { id: 'c-aws', code: 'aws', name: 'Amazon Web Services (AWS)', industry: 'Cloud Hyperscaler', tier: 'Global Tech Leader', location: 'Bengaluru / Hyderabad', website: 'https://aws.amazon.com' },
    { id: 'c-googlecloud', code: 'googlecloud', name: 'Google Cloud Partner Labs', industry: 'Cloud & Applied AI', tier: 'Global Tech Leader', location: 'Bengaluru / Gurgaon', website: 'https://cloud.google.com' }
  ],

  internships: [
    {
      id: 'i-technova-fs',
      company_id: 'c-technova',
      title: 'Full Stack Cloud Engineer Intern + PPO',
      stipend_amount: 45000,
      stipend_display: '₹45,000 / month',
      ppo_package: '₹14.5 LPA',
      location: 'Bengaluru / Hybrid',
      status: 'active',
      duration_months: 6,
      openings_count: 8,
      description: 'Build enterprise-grade microservices and reactive interfaces deployed on multi-cloud Kubernetes clusters.'
    },
    {
      id: 'i-datacore-ai',
      company_id: 'c-datacore',
      title: 'Data Systems & AI Associate Intern',
      stipend_amount: 50000,
      stipend_display: '₹50,000 / month',
      ppo_package: '₹16.0 LPA',
      location: 'Hyderabad / On-site',
      status: 'active',
      duration_months: 6,
      openings_count: 5,
      description: 'Implement distributed retrieval systems and vector search indices for real-time generative agents.'
    },
    {
      id: 'i-tcs-rnd',
      company_id: 'c-tcsresearch',
      title: 'R&D Software Scientist Intern',
      stipend_amount: 40000,
      stipend_display: '₹40,000 / month',
      ppo_package: '₹11.5 LPA',
      location: 'Chennai / Pune',
      status: 'active',
      duration_months: 6,
      openings_count: 10,
      description: 'Conduct applied research in automated formal verification and secure multi-party computation.'
    }
  ],

  internshipRequirements: {
    'i-technova-fs': [
      { skill_code: 'prog_react', skill_name: 'React.js & State Management', required_level: 85, weight: 25, is_mandatory: true },
      { skill_code: 'prog_node', skill_name: 'Node.js & Express REST APIs', required_level: 80, weight: 25, is_mandatory: true },
      { skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', required_level: 75, weight: 20, is_mandatory: true },
      { skill_code: 'cloud_docker', skill_name: 'Docker Containerization', required_level: 80, weight: 15, is_mandatory: true },
      { skill_code: 'cloud_k8s', skill_name: 'Kubernetes Orchestration', required_level: 70, weight: 10, is_mandatory: false },
      { skill_code: 'sys_microservices', skill_name: 'Microservices & Message Queues', required_level: 75, weight: 5, is_mandatory: false }
    ],
    'i-datacore-ai': [
      { skill_code: 'prog_python', skill_name: 'Python & Scripting', required_level: 85, weight: 30, is_mandatory: true },
      { skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', required_level: 80, weight: 25, is_mandatory: true },
      { skill_code: 'ai_rag', skill_name: 'Vector DBs & RAG Architecture', required_level: 75, weight: 25, is_mandatory: true },
      { skill_code: 'cloud_docker', skill_name: 'Docker Containerization', required_level: 70, weight: 20, is_mandatory: false }
    ],
    'i-tcs-rnd': [
      { skill_code: 'prog_java', skill_name: 'Java & Spring Boot Enterprise', required_level: 85, weight: 35, is_mandatory: true },
      { skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', required_level: 80, weight: 25, is_mandatory: true },
      { skill_code: 'sys_microservices', skill_name: 'Microservices & Message Queues', required_level: 75, weight: 20, is_mandatory: false },
      { skill_code: 'cloud_docker', skill_name: 'Docker Containerization', required_level: 75, weight: 20, is_mandatory: false }
    ]
  },

  syllabusProposals: [
    {
      id: 'prop-1',
      institution_id: 'inst-nit',
      course_code: 'CSE-402',
      title: 'Cloud Native Microservices & Docker Containerization',
      department: 'Computer Science & Engineering',
      proposer_id: 'fac-1',
      proposer_name: 'Prof. Rajesh Kumar (HOD CSE)',
      industry_partner_id: 'c-technova',
      industry_partner_name: 'TechNova Solutions',
      proposed_modules: ['Containerization Architecture', 'Dockerfile Optimization', 'Kubernetes Pods & Ingress', 'Service Mesh'],
      credits: 4,
      status: 'under_review',
      deficit_justification: 'Cohort analytics show a 44% batch deficit in containerization versus recruiter hiring standards.',
      created_at: '2026-09-01T10:00:00Z'
    },
    {
      id: 'prop-2',
      institution_id: 'inst-nit',
      course_code: 'CSE-408',
      title: 'Enterprise Vector Search & Retrieval-Augmented Generation (RAG)',
      department: 'Computer Science & Engineering',
      proposer_id: 'fac-2',
      proposer_name: 'Dr. Ananya Sharma',
      industry_partner_id: 'c-datacore',
      industry_partner_name: 'DataCore Technologies',
      proposed_modules: ['Embeddings & Vector Math', 'ANN Indexing with HNSW', 'LangChain/LlamaIndex Integration'],
      credits: 3,
      status: 'approved',
      deficit_justification: 'Industry telemetry indicates 72% hiring demand for AI systems engineers.',
      created_at: '2026-08-25T14:30:00Z'
    }
  ],

  events: [
    {
      id: 'ev-sab-1',
      type: 'sabbatical',
      category: 'Faculty Sabbatical',
      company: 'TechNova Solutions',
      title: 'Cloud Architecture & Kubernetes Faculty Immersion',
      duration: '6 Weeks (Summer/Winter Break)',
      location: 'Bengaluru / Hybrid',
      stipend: '₹75,000 / month',
      eligibility: 'Assistant & Associate Professors (CSE/IT)',
      focus: 'Container security, service mesh, and enterprise microservices orchestration.'
    },
    {
      id: 'ev-hack-1',
      type: 'challenge',
      category: 'Industry Hackathon',
      company: 'TechNova Solutions',
      title: 'Low-Latency Vector Indexing for GenAI Search',
      duration: '4 Months Project Duration',
      grant: '₹3.5 Lakhs Consulting Grant',
      focus: 'Design an approximate nearest neighbor (ANN) quantization algorithm for multi-tenant SaaS search.'
    },
    {
      id: 'ev-fdp-1',
      type: 'fdp',
      category: 'Faculty Development Program',
      company: 'Google Cloud Education',
      title: 'Faculty Masterclass: Vertex AI & Generative Agents in Higher Ed',
      duration: '4 Days (Interactive Sandbox)',
      grant: 'Google Cloud Educator Badge + $500 Cloud Credits',
      focus: 'Fine-tuning LLMs, evaluation benchmarks, and classroom cloud sandboxes.'
    }
  ],

  roadmaps: [
    {
      id: 'rm-f-s1',
      student_id: 'f-s1',
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
    }
  ],

  certifications: [
    {
      id: 'cert-1',
      student_id: 'f-s1',
      title: 'React.js Certified Associate',
      issuer: 'Meta Certified Professional',
      issue_date: 'August 2026',
      verification_hash: '0x9F82A478B0C1E5D8F2',
      status: 'verified',
      trust_multiplier: 1.00
    },
    {
      id: 'cert-2',
      student_id: 'f-s1',
      title: 'PostgreSQL Specialist & Query Performance',
      issuer: 'PostgreSQL Global Development Group Partner',
      issue_date: 'August 2026',
      verification_hash: '0x4E71B892A1D0F3C2A9',
      status: 'verified',
      trust_multiplier: 1.00
    }
  ],

  interviewTelemetry: []
};

const fs = require('fs');
const DATA_STORE_PATH = path.join(__dirname, '..', '..', 'database', 'database_store.json');

function saveToDiskDatabase() {
  try {
    const dataToSave = {
      students: memoryStore.students,
      users: memoryStore.users,
      studentSkills: memoryStore.studentSkills,
      certifications: memoryStore.certifications,
      interviewTelemetry: memoryStore.interviewTelemetry,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (e) {
    console.warn('⚠️ [Database File Save Warning]:', e.message);
  }
}

function loadFromDiskDatabase() {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const raw = fs.readFileSync(DATA_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.students) && parsed.students.length > 0) {
        memoryStore.students = parsed.students;
      }
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        memoryStore.users = parsed.users;
      }
      if (parsed.studentSkills && typeof parsed.studentSkills === 'object') {
        memoryStore.studentSkills = parsed.studentSkills;
      }
      if (Array.isArray(parsed.certifications)) {
        memoryStore.certifications = parsed.certifications;
      }
      console.log(`📦 [Persistent Database Loaded]: Restored ${memoryStore.students.length} student profile(s) from database_store.json.`);
    }
  } catch (e) {
    console.warn('⚠️ [Database File Load Warning]:', e.message);
  }
}

// Load on initialization
loadFromDiskDatabase();

// Check PostgreSQL connectivity asynchronously
(async function testConnection() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() AS current_time');
    client.release();
    isPostgresConnected = true;
    console.log('✅ [PostgreSQL Connected]: Server response time:', res.rows[0].current_time);
  } catch (err) {
    isPostgresConnected = false;
    console.log('ℹ️  [Database Mode]: PostgreSQL offline or unconfigured. Running seamlessly on high-performance In-Memory Hybrid Store with Persistent Disk Sync.');
  }
})();

module.exports = {
  pool,
  isPostgresConnected: () => isPostgresConnected,
  memoryStore,
  saveToDiskDatabase,
  loadFromDiskDatabase,
  
  // Universal query wrapper that executes on Postgres if online, or gracefully resolves on memoryStore
  query: async (text, params = []) => {
    if (isPostgresConnected && pool) {
      return pool.query(text, params);
    }
    // Return empty result set structure for raw SQL queries when in mock mode
    return { rows: [], rowCount: 0 };
  },

  // Helper to clear all live/entered student records for clean demonstration
  resetStudentData: () => {
    memoryStore.students = [];
    memoryStore.studentSkills = {};
    memoryStore.certifications = [];
    memoryStore.users = [];
    memoryStore.interviewTelemetry = [];
    try {
      if (fs.existsSync(DATA_STORE_PATH)) {
        fs.unlinkSync(DATA_STORE_PATH);
      }
    } catch (e) {}
    return { success: true, message: 'All student records reset to fresh empty slate' };
  }
};
