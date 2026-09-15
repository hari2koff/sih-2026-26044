-- =============================================================================
-- SkillBridge Platform Seed Data - PostgreSQL (SIH 2026 - PS ID: SIH26044)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. INSTITUTIONS
-- -----------------------------------------------------------------------------
INSERT INTO institutions (id, name, code, dean_name, dean_email, address, state)
VALUES 
('inst-nit', 'National Institute of Technology', 'NIT-01', 'Dr. S. K. Mukherjee', 'dean.academics@nit.edu', 'National Highway 66, Surathkal', 'Karnataka'),
('inst-iit', 'Indian Institute of Technology Madras', 'IITM-04', 'Dr. V. Kamakoti', 'dean@iitm.ac.in', 'Sardar Patel Road, Chennai', 'Tamil Nadu');

-- -----------------------------------------------------------------------------
-- 2. USERS (bcrypt default hash for 'password123': $2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role) VALUES
('u-student-1', 'hariprasad.ps@student.nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'student'),
('u-student-2', 'harshavardhan@student.nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'student'),
('u-student-3', 'kalangyiam@student.nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'student'),
('u-student-4', 'harish.m@student.nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'student'),
('u-student-5', 'heerthick.raj@student.nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'student'),
('u-student-6', 'harini.sri@student.nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'student'),
('u-comp-technova', 'recruiter@technovasolutions.io', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'company'),
('u-comp-datacore', 'careers@datacore.ai', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'company'),
('u-comp-zoho', 'talent@zohocorp.com', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'company'),
('u-faculty-1', 'rsharma.cse@nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'faculty'),
('u-faculty-2', 'dean.academics@nit.edu', '$2b$10$wTkygJ8jQv8Z4ZfDq8GjAOCfG/vJm2cE.d5TzF2wWv4o1JzC4Tfe.', 'admin');

-- -----------------------------------------------------------------------------
-- 3. STUDENTS
-- -----------------------------------------------------------------------------
INSERT INTO students (id, user_id, institution_id, name, roll_no, department, semester, cgpa, overall_readiness, verified_badges_count, critical_gaps_count, tests_passed, active_building_skill, target_company, radar_prog, radar_web, radar_db, radar_cloud, radar_system, radar_soft, status, trend)
VALUES
('f-s1', 'u-student-1', 'inst-nit', 'Hariprasad PS', '2022CSE1042', 'Computer Science & Engineering', '7th Semester', 8.72, 78, 4, 2, 3, 'Docker Containerization & Microservices', 'TechNova Solutions (Full Stack)', 85, 84, 80, 42, 56, 86, 'bridging', '+6% this month'),
('f-s2', 'u-student-2', 'inst-nit', 'Harshavardhan', '2022CSE1018', 'Computer Science & Engineering', '7th Semester', 9.12, 92, 5, 0, 6, 'Distributed Systems & Chaos Testing', 'TechNova / Zoho Product Team', 92, 90, 88, 84, 82, 90, 'ready', '+11% this month'),
('f-s3', 'u-student-3', 'inst-nit', 'Kalangyiam', '2022CSE1014', 'Computer Science & Engineering', '7th Semester', 8.40, 81, 3, 1, 4, 'AWS CloudFormation & Terraform IaC', 'Amazon Web Services', 80, 78, 82, 74, 70, 82, 'bridging', '+4% this month'),
('f-s4', 'u-student-4', 'inst-nit', 'Harish M', '2022CSE1120', 'Computer Science & Engineering', '7th Semester', 7.95, 64, 2, 3, 2, 'FastAPI REST APIs & SQL Modeling', 'Front-end Track at TechNova', 62, 76, 60, 30, 40, 75, 'support', '+8% this month'),
('f-s5', 'u-student-5', 'inst-nit', 'Heerthick Raj', '2022CSE1082', 'Computer Science & Engineering', '7th Semester', 8.65, 86, 4, 0, 5, 'RAG Architecture & Latency Tuning', 'DataCore AI Systems', 86, 80, 84, 72, 75, 88, 'ready', '+7% this month'),
('f-s6', 'u-student-6', 'inst-nit', 'Harini Sri', '2022CSE1064', 'Computer Science & Engineering', '7th Semester', 9.05, 90, 4, 0, 6, 'Service Mesh & Cloud Infrastructure Security', 'Google Cloud / AWS Partner', 90, 86, 85, 88, 82, 92, 'ready', '+9% this month');

-- -----------------------------------------------------------------------------
-- 4. SKILLS TAXONOMY
-- -----------------------------------------------------------------------------
INSERT INTO skills (id, name, category, description) VALUES
('react', 'React.js & Front-end', 'Web', 'React 18/19 components, hooks, virtual DOM, performance profiling'),
('node', 'Node.js & Express REST APIs', 'Web', 'Asynchronous I/O, Express routing, middleware, REST contracts'),
('python', 'Python & Scripting', 'Programming', 'Python 3 idioms, data modeling, automation, and backend frameworks'),
('dsa', 'Data Structures & Algorithms', 'Programming', 'Arrays, Graphs, Dynamic Programming, Time & Space Complexity'),
('sql', 'Relational DBMS & SQL (PostgreSQL)', 'Databases', 'ACID transactions, relational normalization, complex JOINs, B-Tree indexes'),
('git', 'Git Version Control & CI/CD Basics', 'DevOps', 'Branching workflows, rebase, merge resolution, GitHub Actions pipelines'),
('docker', 'Docker Containerization', 'DevOps', 'Dockerfile optimization, multi-stage builds, container networking, compose'),
('k8s', 'Kubernetes Orchestration', 'DevOps', 'Pods, Deployments, Services, Helm charts, ingress load balancers'),
('sysdesign', 'System Design & High Availability', 'Architecture', 'Horizontal scalability, load balancing, caching tiers, CAP theorem'),
('microservices', 'Microservices & Message Queues', 'Architecture', 'Service decomposition, event-driven architecture, RabbitMQ/Kafka'),
('aws', 'AWS Cloud Fundamentals (EC2, S3, IAM)', 'DevOps', 'Cloud infrastructure provisioning, security policies, VPC architecture'),
('soft', 'Analytical Thinking & Agile Communication', 'Aptitude', 'Structured problem solving, cross-functional collaboration, agile sprints'),
('vector', 'Vector Databases & Semantic Embeddings', 'AI & Data', 'High-dimensional embeddings, Pinecone, Milvus, Chroma vector indexing'),
('redis', 'Redis In-Memory Distributed Caching', 'Architecture', 'Key-value data structures, eviction policies, pub/sub messaging'),
('terraform', 'Terraform Infrastructure as Code', 'DevOps', 'Declarative cloud provisioning, state management, provider configuration'),
('rust', 'Rust Systems Programming', 'Programming', 'Memory safety without garbage collection, borrow checker, fearless concurrency');

-- -----------------------------------------------------------------------------
-- 5. STUDENT SKILLS (Hariprasad PS - Initial State)
-- -----------------------------------------------------------------------------
INSERT INTO student_skills (student_id, skill_id, proficiency_level, status, trust_tier, trust_multiplier, evidence_note) VALUES
('f-s1', 'react', 88, 'verified', 'verified', 1.00, 'Faculty Endorsed & GitHub Repositories'),
('f-s1', 'node', 82, 'verified', 'verified', 1.00, 'SkillBridge Proctored Benchmark (Score: 88%)'),
('f-s1', 'python', 86, 'verified', 'verified', 1.00, 'Academic Coursework & Code Assessment'),
('f-s1', 'dsa', 85, 'verified', 'verified', 1.00, 'National Level Coding Rank (Gold Tier)'),
('f-s1', 'sql', 80, 'verified', 'verified', 1.00, 'Cryptographic Certificate (Score: 100%)'),
('f-s1', 'git', 90, 'verified', 'verified', 1.00, 'Verified GitHub Contribution Graph'),
('f-s1', 'docker', 35, 'critical-gap', 'assessed', 0.75, 'Diagnostic Assessment (Deficit Area)'),
('f-s1', 'k8s', 20, 'critical-gap', 'self-declared', 0.40, 'Self-Reported Claim'),
('f-s1', 'sysdesign', 54, 'gap', 'assessed', 0.75, 'Mid-Semester System Design Assessment'),
('f-s1', 'microservices', 40, 'gap', 'assessed', 0.75, 'Diagnostic Assessment'),
('f-s1', 'aws', 45, 'gap', 'assessed', 0.75, 'Platform Diagnostic Lab Test'),
('f-s1', 'soft', 88, 'verified', 'verified', 1.00, 'Placement Cell Mock Interview Panel');

-- -----------------------------------------------------------------------------
-- 6. RECRUITER COMPANIES
-- -----------------------------------------------------------------------------
INSERT INTO companies (id, user_id, name, brand_letter, brand_color, location, website, industry) VALUES
('technova', 'u-comp-technova', 'TechNova Solutions', 'TN', 'linear-gradient(135deg, #0f172a, #2563eb)', 'Bengaluru / Hybrid', 'https://technovasolutions.io', 'Enterprise Cloud & SaaS'),
('datacore', 'u-comp-datacore', 'DataCore Technologies', 'DC', 'linear-gradient(135deg, #0ea5e9, #0284c7)', 'Hyderabad / On-site', 'https://datacore.ai', 'AI Systems & Vector Infrastructure'),
('tcsresearch', NULL, 'TCS Research & Innovation', 'TR', 'linear-gradient(135deg, #22c55e, #16a34a)', 'Chennai / Pune', 'https://tcs.com/research', 'Advanced Computing & Systems Research'),
('zoho', 'u-comp-zoho', 'Zoho Corporation', 'ZH', 'linear-gradient(135deg, #ef4444, #dc2626)', 'Chennai / Tenkasi', 'https://zoho.com', 'SaaS Product Engineering'),
('aws', NULL, 'Amazon Web Services (AWS)', 'AW', 'linear-gradient(135deg, #f59e0b, #d97706)', 'Bengaluru / Hyderabad', 'https://aws.amazon.com', 'Cloud Hyperscaler & Infrastructure'),
('googlecloud', NULL, 'Google Cloud Partner Labs', 'GC', 'linear-gradient(135deg, #4285f4, #0f9d58)', 'Bengaluru / Gurgaon', 'https://cloud.google.com', 'AI & Cloud Infrastructure');

-- -----------------------------------------------------------------------------
-- 7. INTERNSHIPS & JOB OPPORTUNITIES
-- -----------------------------------------------------------------------------
INSERT INTO internships (id, company_id, role_title, category, location, stipend, ppo_package, tier, explainable_reason, benchmark_prog, benchmark_web, benchmark_db, benchmark_cloud, benchmark_system, benchmark_soft) VALUES
('int-technova-1', 'technova', 'Full Stack Cloud Engineer Intern + PPO', 'Full Stack', 'Bengaluru / Hybrid', '₹45,000 / mo', '14.5 LPA', 'moderate', 'Strong match on React, Node.js & SQL (+60%). Lacks production Docker & Kubernetes containerization (-16%).', 80, 85, 78, 75, 70, 80),
('int-datacore-1', 'datacore', 'Data Systems & AI Associate', 'AI & Data', 'Hyderabad / On-site', '₹50,000 / mo', '16.0 LPA', 'high', 'Excellent Python, Algorithmic DSA, and Relational Modeling (+66%). Minor gap in Vector Search & PySpark (-11%).', 88, 65, 85, 60, 65, 82),
('int-tcsresearch-1', 'tcsresearch', 'R&D Software Scientist Intern', 'Systems', 'Chennai / Pune', '₹40,000 / mo', '11.5 LPA', 'high', 'Exceeds institutional academic thresholds in Core CS, Algorithms, and Operating Systems (+78%). Direct interview eligible.', 82, 60, 75, 50, 65, 85),
('int-zoho-1', 'zoho', 'Product Software Engineer - Backend', 'Full Stack', 'Chennai / Tenkasi', '₹38,000 / mo', '12.0 LPA', 'high', 'Superior problem-solving foundations and clean API design (+72%). Requires Redis In-memory Caching (-14%).', 86, 75, 82, 55, 75, 80),
('int-aws-1', 'aws', 'Cloud Solutions Associate Intern', 'Cloud & DevOps', 'Bengaluru / Hyderabad', '₹65,000 / mo', '22.0 LPA', 'target', 'Solid core programming & Linux foundations (+48%). Critical gap in AWS VPC, IAM, and Terraform Infrastructure (-32%).', 80, 70, 78, 88, 82, 85),
('int-googlecloud-1', 'googlecloud', 'Cloud AI & ML Systems Engineer', 'AI & Data', 'Bengaluru / Gurgaon', '₹70,000 / mo', '24.0 LPA', 'moderate', 'Solid math & Python backend skills (+52%). Deficit in Vertex AI pipelines, GKE Kubernetes deployment (-28%).', 88, 70, 80, 85, 85, 85);

-- -----------------------------------------------------------------------------
-- 8. INTERNSHIP REQUIREMENTS (TechNova Competency Vectors)
-- -----------------------------------------------------------------------------
INSERT INTO internship_requirements (internship_id, skill_name, category, required_level, weight_percentage, requirement_type, severity) VALUES
('int-technova-1', 'React.js & State Management', 'Web', 85, 25, 'Core', 'verified'),
('int-technova-1', 'Node.js & Express REST APIs', 'Web', 80, 25, 'Core', 'verified'),
('int-technova-1', 'PostgreSQL Database Modeling', 'Databases', 75, 20, 'Core', 'verified'),
('int-technova-1', 'Docker Containerization', 'DevOps', 80, 15, 'Core', 'critical'),
('int-technova-1', 'Kubernetes Cluster Basics', 'DevOps', 70, 10, 'Elective', 'critical'),
('int-technova-1', 'Microservices & Async Queues', 'Architecture', 75, 5, 'Elective', 'recommended');

-- -----------------------------------------------------------------------------
-- 9. FACULTY PROFILES
-- -----------------------------------------------------------------------------
INSERT INTO faculty (id, user_id, institution_id, name, department, designation, employee_code) VALUES
('fac-1', 'u-faculty-1', 'inst-nit', 'Prof. R. Sharma', 'Computer Science & Engineering', 'Associate Professor & Placement Liaison', 'FAC-NIT-CSE-042'),
('fac-2', NULL, 'inst-nit', 'Dr. Meenakshi Sundaram', 'Computer Science & Engineering', 'Associate Professor (Data & AI)', 'FAC-NIT-CSE-018'),
('fac-3', NULL, 'inst-nit', 'Dr. K. Ramanathan', 'Computer Science & Engineering', 'Professor & Head of Department', 'FAC-NIT-CSE-001'),
('fac-4', 'u-faculty-2', 'inst-nit', 'Dr. S. K. Mukherjee', 'Academics & Board of Studies', 'Dean of Academics & Chairman BoS', 'DEAN-NIT-ACAD-01');

-- -----------------------------------------------------------------------------
-- 10. SYLLABUS REVISION PROPOSALS (Dean / BoS Registry)
-- -----------------------------------------------------------------------------
INSERT INTO syllabus_proposals (id, tracking_id, faculty_id, proposed_by, target_dean, title, target_course_code, deficit_stat, rationale, status) VALUES
('prop-1', 'BOS-REV-2026-084', 'fac-1', 'Prof. R. Sharma (CSE Faculty Admin)', 'Dr. S. K. Mukherjee (Dean of Academics)', 'Inclusion of Production Docker Containerization & Kubernetes in CSE-402', 'CSE-402: Cloud Deployment Lab', '68% Batch Deficit (82 Students Lacking Required Recruiter Skills)', 'Mandatory benchmark cutoff for TechNova, AWS, and Google Cloud internship hiring. Adding this module eliminates this gap before placement drives commence.', 'review'),
('prop-2', 'BOS-REV-2026-079', 'fac-2', 'Dr. Meenakshi Sundaram (Assoc. Prof)', 'Dr. S. K. Mukherjee (Dean of Academics)', 'New 8th-Sem Elective: Enterprise Vector Search & Generative AI Systems', 'CSE-491: Generative AI & Vector Architectures', '72% Deficit across AI & Data Recruiter Benchmarks', 'DataCore & TCS corporate hiring requirements for high CTC roles (16+ LPA).', 'approved');

-- -----------------------------------------------------------------------------
-- 11. EVENTS & INDUSTRY COLLABORATION (Sabbaticals, Challenges, R&D, FDPs)
-- -----------------------------------------------------------------------------
INSERT INTO events (id, event_type, company_id, company_name, title, duration_or_dates, location_or_mode, stipend_or_grant, badge_tag, eligibility_or_professor, description_or_benefits, deliverable, status) VALUES
('sab-1', 'sabbatical', 'technova', 'TechNova Solutions', 'Cloud Architecture & Kubernetes Faculty Immersion', '6 Weeks (Summer/Winter Break)', 'Bengaluru / Hybrid', '₹75,000 / month', 'Corporate Immersion', 'Assistant & Associate Professors (CSE/IT)', 'Container security, service mesh, and enterprise microservices orchestration.', 'Curriculum case study + classroom production demos', 'Open for Enrollment'),
('sab-2', 'sabbatical', 'zoho', 'Zoho Corporation', 'High-Concurrency Product Systems Faculty Sabbatical', '8 Weeks', 'Chennai Campus', '₹85,000 / month', 'Product Systems', 'Faculty with 3+ Years Systems / OS Teaching', 'Low-latency in-memory databases, compiler optimization, and distributed storage.', 'Production architectural insights for OS course', 'Open for Enrollment'),
('chal-1', 'challenge', 'technova', 'TechNova Solutions', 'Low-Latency Vector Indexing for GenAI Search', '4 Months Project Duration', 'Remote / Cloud Sandbox', '₹3.5 Lakhs Consulting Grant', 'R&D Challenge #104', 'Faculty with ML / Algorithms Domain', 'Design an approximate nearest neighbor (ANN) quantization algorithm for multi-tenant SaaS search.', 'Algorithmic proof of concept + benchmark paper', 'Open for Enrollment'),
('chal-2', 'challenge', NULL, 'CloudWave Robotics', 'Edge Vision Pipeline for Autonomous Warehouse AGVs', '6 Months Project Duration', 'Hardware Lab / Campus', '₹5.0 Lakhs Research Grant', 'Robotics Challenge #88', 'Embedded Systems & Computer Vision Faculty', 'Deploy real-time obstacle avoidance on embedded Jetson Orin modules with under 15ms inference latency.', 'Optimized TensorRT model + hardware demo', 'Open for Enrollment'),
('rnd-1', 'rnd', NULL, 'Tata R&D', 'Hybrid Multi-Cloud Container Mesh Resilience', '1 Year Academic-Industry Partnership', 'Co-Laboratory', '₹12.5 Lakhs Grant', 'Joint Patent Track', 'Dr. K. Ramanathan (HoD, CSE)', 'Multi-cloud enterprise container mesh failover and consensus verification.', 'Joint Patent Application + 2 IEEE Transactions Publications', 'Active Grant'),
('rnd-2', 'rnd', 'datacore', 'DataCore AI Research', 'Enterprise Semantic Search Optimization', '9 Months Academic Partnership', 'Virtual AI Lab', '₹9.0 Lakhs Grant', 'Joint Open Source Lab', 'Dr. Meenakshi Sundaram (Assoc. Prof)', 'Vector database quantization and multi-modal reranking architectures.', 'Industrial Open Source Library + Faculty-Student Research Paper', 'Active Grant'),
('fdp-1', 'fdp', 'technova', 'TechNova Solutions', '5-Day Corporate FDP: Production Microservices & Kubernetes', 'Sep 18 – 22, 2026', 'Hybrid (Campus Lab + Live Corporate Architect)', NULL, 'Industry Certified FDP', 'Faculty & PhD Scholars', 'Co-branded Faculty Certificate, Hands-on Cloud Sandboxes, Free Courseware for College', 'Certified Faculty Credential', 'Open for Enrollment'),
('fdp-2', 'fdp', 'googlecloud', 'Google Cloud Education', 'Faculty Masterclass: Vertex AI & Generative Agents in Higher Ed', 'Oct 05 – 08, 2026', 'Virtual Lab (Interactive Google Cloud Sandbox)', NULL, 'Google Certified Educator', 'AI/ML Faculty Members', 'Google Cloud Educator Badge, $500 Cloud Credits for Student Lab Projects', 'Official Google Cloud Educator Certificate', 'Open for Enrollment'),
('fdp-3', 'fdp', 'aws', 'Amazon Web Services (AWS)', 'AWS Academy Cloud Educator Certification Workshop', 'Oct 20 – 24, 2026', 'Virtual Self-Paced + Live Q&A', NULL, 'AWS Academy Partner', 'Cloud & Systems Instructors', 'Free AWS Solutions Architect Exam Voucher, Official AWS Curriculum Licensing', 'AWS Academy Accreditation', 'Open for Enrollment'),
('fdp-4', 'fdp', NULL, 'NVIDIA Deep Learning Institute', 'Accelerated Computing & LLM Fine-Tuning for CS Faculty', 'Nov 02 – 04, 2026', 'Virtual GPU Workstation Access', NULL, 'NVIDIA DLI Certificate', 'Faculty handling HPC / AI courses', 'NVIDIA DLI Teaching Kit, 50 Cloud GPU Hours for Department Lab', 'DLI Certified Instructor Status', 'Open for Enrollment');

-- -----------------------------------------------------------------------------
-- 12. LEARNING ROADMAPS
-- -----------------------------------------------------------------------------
INSERT INTO learning_roadmaps (id, title, curated_by, author_initials, badge_label, phases) VALUES
('road-technova', 'TechNova Full Stack & Microservices Roadmap (2026 Batch)', 'TechNova Senior Cloud Engineering Team', 'TN', 'Official Partner Roadmap',
 '[
   {"phase": 1, "title": "Phase 1: React & Frontend Foundations", "desc": "Advanced TypeScript, React 19 State Machines, REST API contracts. Completed & Verified.", "status": "completed"},
   {"phase": 2, "title": "Phase 2: Data & Backend", "desc": "PostgreSQL connection pooling, indexing, ACID transactions. Completed & Verified.", "status": "completed"},
   {"phase": 3, "title": "Phase 3: Docker & Microservices", "desc": "Containerizing Node/React services, Docker Compose multi-containers.", "status": "active_gap"},
   {"phase": 4, "title": "Phase 4: Kubernetes & K8s", "desc": "Pods, Services, Helm charts, Ingress routing and production cluster health monitors.", "status": "upcoming"}
 ]'::jsonb),
('road-datacore', 'DataCore Vector Systems & Semantic Search Track', 'DataCore AI Research Division', 'DC', 'AI/ML Pathway',
 '[
   {"phase": 1, "title": "Phase 1: Python & Linear Algebra", "desc": "NumPy vectorized operations, Pandas transformations, embedding math.", "status": "completed"},
   {"phase": 2, "title": "Phase 2: Vector Embeddings & Similarity", "desc": "Cosine similarity, dot product, ANN search with Pinecone and Milvus.", "status": "upcoming"},
   {"phase": 3, "title": "Phase 3: RAG Pipelines & Retrieval", "desc": "LangChain, LlamaIndex, context injection, hallucination mitigation.", "status": "upcoming"},
   {"phase": 4, "title": "Phase 4: Production LLMOps", "desc": "Streaming responses, prompt caching, token cost optimization.", "status": "upcoming"}
 ]'::jsonb);

-- -----------------------------------------------------------------------------
-- 13. INITIAL STUDENT CERTIFICATIONS (Hariprasad PS)
-- -----------------------------------------------------------------------------
INSERT INTO student_certifications (student_id, skill_name, cert_title, endorsed_by, crypto_hash, issue_date, trust_tier) VALUES
('f-s1', 'React.js & Full Stack REST Architecture', 'Certificate of Competency', 'TechNova Engineering', '0x9F82A478B0C1E5', '14 Aug 2026', 'verified'),
('f-s1', 'Relational DBMS & SQL Optimization', 'Certificate of Competency', 'SkillBridge Examination Board', '0x4E71B892A1D0F3', '14 Aug 2026', 'verified');

-- -----------------------------------------------------------------------------
-- 14. INTERVIEW TELEMETRY (Recruiter to BoS Telemetry Log)
-- -----------------------------------------------------------------------------
INSERT INTO interview_telemetry (student_id, candidate_name, company_name, outcome, core_strengths, technical_deficits, sync_bos_dean) VALUES
('f-s1', 'Hariprasad PS', 'TechNova Solutions', 'shortlist', 'Clean React state management, fast SQL query optimization, strong Git hygiene', 'Candidate demonstrated superior SQL and REST API architecture, but struggled with Docker multi-stage builds and persistent volume mounts during live sandbox coding challenge.', TRUE);
