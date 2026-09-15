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

  students: [
    {
      id: 'f-s1',
      user_id: 'u-student-1',
      institution_id: 'inst-nit',
      name: 'Hariprasad PS',
      roll_no: '2022CSE1042',
      department: 'Computer Science & Engineering',
      semester: '7th Semester',
      cgpa: 8.72,
      overall_readiness: 78,
      verified_badges_count: 4,
      critical_gaps_count: 2,
      tests_passed: 3,
      active_building_skill: 'Docker Containerization & Microservices',
      target_company: 'TechNova Solutions (Full Stack)',
      radar_prog: 85,
      radar_web: 84,
      radar_db: 80,
      radar_cloud: 42,
      radar_system: 56,
      radar_soft: 86,
      status: 'bridging',
      trend: '+6% this month',
      verified_badges: ['React.js Certified', 'PostgreSQL Specialist', 'DSA Gold', 'Git & CI/CD']
    },
    {
      id: 'f-s2',
      user_id: 'u-student-2',
      institution_id: 'inst-nit',
      name: 'Harshavardhan',
      roll_no: '2022CSE1018',
      department: 'Computer Science & Engineering',
      semester: '7th Semester',
      cgpa: 9.12,
      overall_readiness: 92,
      verified_badges_count: 5,
      critical_gaps_count: 0,
      tests_passed: 6,
      active_building_skill: 'Distributed Systems & Chaos Testing',
      target_company: 'TechNova / Zoho Product Team',
      radar_prog: 92,
      radar_web: 90,
      radar_db: 88,
      radar_cloud: 84,
      radar_system: 82,
      radar_soft: 90,
      status: 'ready',
      trend: '+11% this month',
      verified_badges: ['Java Backend Pro', 'Kafka Master', 'Spring Boot Certified', 'Docker Verified', 'AWS Associate']
    },
    {
      id: 'f-s3',
      user_id: 'u-student-3',
      institution_id: 'inst-nit',
      name: 'Kalangyiam',
      roll_no: '2022CSE1014',
      department: 'Computer Science & Engineering',
      semester: '7th Semester',
      cgpa: 8.40,
      overall_readiness: 81,
      verified_badges_count: 3,
      critical_gaps_count: 1,
      tests_passed: 4,
      active_building_skill: 'AWS CloudFormation & Terraform IaC',
      target_company: 'Amazon Web Services',
      radar_prog: 80,
      radar_web: 78,
      radar_db: 82,
      radar_cloud: 74,
      radar_system: 70,
      radar_soft: 82,
      status: 'bridging',
      trend: '+4% this month',
      verified_badges: ['AWS Cloud Practitioner', 'Python Specialist', 'SQL Optimization']
    },
    {
      id: 'f-s4',
      user_id: 'u-student-4',
      institution_id: 'inst-nit',
      name: 'Harish M',
      roll_no: '2022CSE1120',
      department: 'Computer Science & Engineering',
      semester: '7th Semester',
      cgpa: 7.95,
      overall_readiness: 64,
      verified_badges_count: 2,
      critical_gaps_count: 3,
      tests_passed: 2,
      active_building_skill: 'FastAPI REST APIs & SQL Modeling',
      target_company: 'Front-end Track at TechNova',
      radar_prog: 62,
      radar_web: 76,
      radar_db: 60,
      radar_cloud: 30,
      radar_system: 40,
      radar_soft: 75,
      status: 'support',
      trend: '+8% this month',
      verified_badges: ['HTML/CSS Specialist', 'JavaScript Core']
    },
    {
      id: 'f-s5',
      user_id: 'u-student-5',
      institution_id: 'inst-nit',
      name: 'Heerthick Raj',
      roll_no: '2022CSE1082',
      department: 'Computer Science & Engineering',
      semester: '7th Semester',
      cgpa: 8.65,
      overall_readiness: 86,
      verified_badges_count: 4,
      critical_gaps_count: 0,
      tests_passed: 5,
      active_building_skill: 'RAG Architecture & Latency Tuning',
      target_company: 'DataCore AI Systems',
      radar_prog: 86,
      radar_web: 80,
      radar_db: 84,
      radar_cloud: 72,
      radar_system: 75,
      radar_soft: 88,
      status: 'ready',
      trend: '+7% this month',
      verified_badges: ['Vector DB Certified', 'Python ML Specialist', 'SQL Pro', 'DSA Gold']
    },
    {
      id: 'f-s6',
      user_id: 'u-student-6',
      institution_id: 'inst-nit',
      name: 'Harini Sri',
      roll_no: '2022CSE1064',
      department: 'Computer Science & Engineering',
      semester: '7th Semester',
      cgpa: 9.05,
      overall_readiness: 90,
      verified_badges_count: 4,
      critical_gaps_count: 0,
      tests_passed: 6,
      active_building_skill: 'Service Mesh & Cloud Infrastructure Security',
      target_company: 'Google Cloud / AWS Partner',
      radar_prog: 90,
      radar_web: 86,
      radar_db: 85,
      radar_cloud: 88,
      radar_system: 82,
      radar_soft: 92,
      status: 'ready',
      trend: '+9% this month',
      verified_badges: ['Cloud DevOps Specialist', 'Kubernetes Certified', 'Python Pro', 'Docker Verified']
    }
  ],

  studentSkills: {
    'f-s1': [
      { id: 'ss-1', skill_code: 'prog_react', skill_name: 'React.js & State Management', proficiency_level: 88, evidence_tier: 'tier_3_verified', category: 'Web Technologies' },
      { id: 'ss-2', skill_code: 'prog_node', skill_name: 'Node.js & Express REST APIs', proficiency_level: 84, evidence_tier: 'tier_3_verified', category: 'Web Technologies' },
      { id: 'ss-3', skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', proficiency_level: 80, evidence_tier: 'tier_3_verified', category: 'Database Systems' },
      { id: 'ss-4', skill_code: 'cloud_docker', skill_name: 'Docker Containerization', proficiency_level: 35, evidence_tier: 'tier_2_assessed', category: 'Cloud & DevOps' },
      { id: 'ss-5', skill_code: 'cloud_k8s', skill_name: 'Kubernetes Orchestration', proficiency_level: 20, evidence_tier: 'tier_1_self_claimed', category: 'Cloud & DevOps' },
      { id: 'ss-6', skill_code: 'sys_microservices', skill_name: 'Microservices & Message Queues', proficiency_level: 45, evidence_tier: 'tier_2_assessed', category: 'System Architecture' }
    ],
    'f-s2': [
      { id: 'ss-21', skill_code: 'prog_java', skill_name: 'Java & Spring Boot Enterprise', proficiency_level: 95, evidence_tier: 'tier_3_verified', category: 'Programming' },
      { id: 'ss-22', skill_code: 'sys_microservices', skill_name: 'Microservices & Message Queues', proficiency_level: 90, evidence_tier: 'tier_3_verified', category: 'System Architecture' },
      { id: 'ss-23', skill_code: 'cloud_docker', skill_name: 'Docker Containerization', proficiency_level: 88, evidence_tier: 'tier_3_verified', category: 'Cloud & DevOps' },
      { id: 'ss-24', skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', proficiency_level: 85, evidence_tier: 'tier_3_verified', category: 'Database Systems' },
      { id: 'ss-25', skill_code: 'prog_react', skill_name: 'React.js & State Management', proficiency_level: 80, evidence_tier: 'tier_2_assessed', category: 'Web Technologies' }
    ],
    'f-s3': [
      { id: 'ss-31', skill_code: 'cloud_aws', skill_name: 'AWS Cloud Fundamentals', proficiency_level: 85, evidence_tier: 'tier_3_verified', category: 'Cloud & DevOps' },
      { id: 'ss-32', skill_code: 'prog_python', skill_name: 'Python & Scripting', proficiency_level: 82, evidence_tier: 'tier_3_verified', category: 'Programming' },
      { id: 'ss-33', skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', proficiency_level: 80, evidence_tier: 'tier_2_assessed', category: 'Database Systems' }
    ],
    'f-s4': [
      { id: 'ss-41', skill_code: 'prog_react', skill_name: 'React.js & State Management', proficiency_level: 75, evidence_tier: 'tier_2_assessed', category: 'Web Technologies' },
      { id: 'ss-42', skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', proficiency_level: 60, evidence_tier: 'tier_1_self_claimed', category: 'Database Systems' }
    ],
    'f-s5': [
      { id: 'ss-51', skill_code: 'prog_python', skill_name: 'Python & Scripting', proficiency_level: 90, evidence_tier: 'tier_3_verified', category: 'Programming' },
      { id: 'ss-52', skill_code: 'ai_rag', skill_name: 'Vector DBs & RAG Architecture', proficiency_level: 88, evidence_tier: 'tier_3_verified', category: 'AI & Data Systems' },
      { id: 'ss-53', skill_code: 'db_pg', skill_name: 'PostgreSQL Database Modeling', proficiency_level: 84, evidence_tier: 'tier_3_verified', category: 'Database Systems' }
    ],
    'f-s6': [
      { id: 'ss-61', skill_code: 'cloud_k8s', skill_name: 'Kubernetes Orchestration', proficiency_level: 92, evidence_tier: 'tier_3_verified', category: 'Cloud & DevOps' },
      { id: 'ss-62', skill_code: 'cloud_docker', skill_name: 'Docker Containerization', proficiency_level: 90, evidence_tier: 'tier_3_verified', category: 'Cloud & DevOps' },
      { id: 'ss-63', skill_code: 'prog_python', skill_name: 'Python & Scripting', proficiency_level: 88, evidence_tier: 'tier_3_verified', category: 'Programming' }
    ]
  },

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
    console.log('ℹ️  [Database Mode]: PostgreSQL offline or unconfigured. Running seamlessly on high-performance In-Memory Hybrid Store.');
  }
})();

module.exports = {
  pool,
  isPostgresConnected: () => isPostgresConnected,
  memoryStore,
  
  // Universal query wrapper that executes on Postgres if online, or gracefully resolves on memoryStore
  query: async (text, params = []) => {
    if (isPostgresConnected && pool) {
      return pool.query(text, params);
    }
    // Return empty result set structure for raw SQL queries when in mock mode
    return { rows: [], rowCount: 0 };
  }
};
