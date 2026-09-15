-- =============================================================================
-- SkillBridge Platform Database Schema - PostgreSQL (SIH 2026 - PS ID: SIH26044)
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS interview_telemetry CASCADE;
DROP TABLE IF EXISTS student_certifications CASCADE;
DROP TABLE IF EXISTS event_enrollments CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS syllabus_proposals CASCADE;
DROP TABLE IF EXISTS learning_roadmaps CASCADE;
DROP TABLE IF EXISTS internship_requirements CASCADE;
DROP TABLE IF EXISTS internships CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS student_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('student', 'company', 'faculty', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. INSTITUTIONS (Colleges & Universities)
-- -----------------------------------------------------------------------------
CREATE TABLE institutions (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    dean_name VARCHAR(150) NOT NULL,
    dean_email VARCHAR(255) NOT NULL,
    address TEXT,
    state VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. STUDENTS
-- -----------------------------------------------------------------------------
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(50) REFERENCES institutions(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science & Engineering',
    semester VARCHAR(50) NOT NULL DEFAULT '7th Semester',
    cgpa NUMERIC(4, 2) DEFAULT 8.50,
    overall_readiness INT DEFAULT 78 CHECK (overall_readiness BETWEEN 0 AND 100),
    verified_badges_count INT DEFAULT 0,
    critical_gaps_count INT DEFAULT 0,
    tests_passed INT DEFAULT 0,
    active_building_skill VARCHAR(255) DEFAULT 'Docker Containerization & Microservices',
    target_company VARCHAR(150) DEFAULT 'TechNova Solutions (Full Stack)',
    radar_prog INT DEFAULT 85 CHECK (radar_prog BETWEEN 0 AND 100),
    radar_web INT DEFAULT 84 CHECK (radar_web BETWEEN 0 AND 100),
    radar_db INT DEFAULT 80 CHECK (radar_db BETWEEN 0 AND 100),
    radar_cloud INT DEFAULT 42 CHECK (radar_cloud BETWEEN 0 AND 100),
    radar_system INT DEFAULT 56 CHECK (radar_system BETWEEN 0 AND 100),
    radar_soft INT DEFAULT 86 CHECK (radar_soft BETWEEN 0 AND 100),
    status VARCHAR(50) DEFAULT 'bridging' CHECK (status IN ('ready', 'bridging', 'support')),
    trend VARCHAR(50) DEFAULT '+6% this month',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. SKILLS TAXONOMY
-- -----------------------------------------------------------------------------
CREATE TABLE skills (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Programming', 'Web', 'Databases', 'DevOps', 'Architecture', 'Aptitude', 'Systems', 'AI & Data', 'Academic')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. STUDENT SKILLS (Competency Vector & Trust Tiers)
-- -----------------------------------------------------------------------------
CREATE TABLE student_skills (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL DEFAULT 0 CHECK (proficiency_level BETWEEN 0 AND 100),
    status VARCHAR(30) NOT NULL DEFAULT 'gap' CHECK (status IN ('verified', 'gap', 'critical-gap', 'in-progress')),
    trust_tier VARCHAR(30) NOT NULL DEFAULT 'self-declared' CHECK (trust_tier IN ('verified', 'assessed', 'self-declared')),
    trust_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 0.40 CHECK (trust_multiplier IN (1.00, 0.75, 0.40)),
    evidence_note TEXT DEFAULT 'Self-Reported Claim',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_id)
);

-- -----------------------------------------------------------------------------
-- 6. RECRUITER COMPANIES
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
    id VARCHAR(50) PRIMARY KEY, -- Slug e.g., 'technova', 'datacore'
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    brand_letter VARCHAR(10) NOT NULL,
    brand_color VARCHAR(100) DEFAULT 'linear-gradient(135deg, #0f172a, #2563eb)',
    location VARCHAR(150),
    website VARCHAR(255),
    industry VARCHAR(100) DEFAULT 'Software & Cloud Technology',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. INTERNSHIPS & JOB OPPORTUNITIES
-- -----------------------------------------------------------------------------
CREATE TABLE internships (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    role_title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Full Stack',
    location VARCHAR(150) NOT NULL,
    stipend VARCHAR(100) NOT NULL,
    ppo_package VARCHAR(100) NOT NULL,
    tier VARCHAR(30) DEFAULT 'moderate' CHECK (tier IN ('high', 'moderate', 'target')),
    explainable_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    benchmark_prog INT DEFAULT 80 CHECK (benchmark_prog BETWEEN 0 AND 100),
    benchmark_web INT DEFAULT 85 CHECK (benchmark_web BETWEEN 0 AND 100),
    benchmark_db INT DEFAULT 78 CHECK (benchmark_db BETWEEN 0 AND 100),
    benchmark_cloud INT DEFAULT 75 CHECK (benchmark_cloud BETWEEN 0 AND 100),
    benchmark_system INT DEFAULT 70 CHECK (benchmark_system BETWEEN 0 AND 100),
    benchmark_soft INT DEFAULT 80 CHECK (benchmark_soft BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. INTERNSHIP REQUIREMENTS (Competency Vectors & Cutoffs)
-- -----------------------------------------------------------------------------
CREATE TABLE internship_requirements (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    internship_id VARCHAR(50) REFERENCES internships(id) ON DELETE CASCADE,
    skill_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    required_level INT NOT NULL CHECK (required_level BETWEEN 0 AND 100),
    weight_percentage INT NOT NULL CHECK (weight_percentage BETWEEN 1 AND 100),
    requirement_type VARCHAR(20) NOT NULL DEFAULT 'Core' CHECK (requirement_type IN ('Core', 'Elective')),
    severity VARCHAR(30) DEFAULT 'critical' CHECK (severity IN ('verified', 'recommended', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. FACULTY PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE faculty (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(50) REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 10. SYLLABUS REVISION PROPOSALS (Dean / BoS Dispatch)
-- -----------------------------------------------------------------------------
CREATE TABLE syllabus_proposals (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE SET NULL,
    proposed_by VARCHAR(150) NOT NULL,
    target_dean VARCHAR(150) NOT NULL DEFAULT 'Dr. S. K. Mukherjee (Dean of Academics)',
    title VARCHAR(255) NOT NULL,
    target_course_code VARCHAR(100) NOT NULL,
    deficit_stat TEXT NOT NULL,
    rationale TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'review' CHECK (status IN ('review', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 11. EVENTS & INDUSTRY COLLABORATION (Sabbaticals, Challenges, R&D, FDPs)
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('sabbatical', 'challenge', 'rnd', 'fdp')),
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE SET NULL,
    company_name VARCHAR(150) NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_or_dates VARCHAR(150) NOT NULL,
    location_or_mode VARCHAR(150) NOT NULL,
    stipend_or_grant VARCHAR(100),
    badge_tag VARCHAR(100),
    eligibility_or_professor VARCHAR(200),
    description_or_benefits TEXT NOT NULL,
    deliverable TEXT,
    status VARCHAR(50) DEFAULT 'Open for Enrollment',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 12. EVENT ENROLLMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE event_enrollments (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    applicant_name VARCHAR(150) NOT NULL,
    applicant_role VARCHAR(30) NOT NULL,
    status VARCHAR(50) DEFAULT 'Enrolled',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. LEARNING ROADMAPS & MILESTONES
-- -----------------------------------------------------------------------------
CREATE TABLE learning_roadmaps (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    curated_by VARCHAR(150) NOT NULL,
    author_initials VARCHAR(10) DEFAULT 'TN',
    badge_label VARCHAR(100) DEFAULT 'Official Partner Roadmap',
    phases JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 14. STUDENT CERTIFICATIONS (Cryptographic Verified Credentials)
-- -----------------------------------------------------------------------------
CREATE TABLE student_certifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    skill_name VARCHAR(150) NOT NULL,
    cert_title VARCHAR(200) NOT NULL,
    endorsed_by VARCHAR(150) NOT NULL,
    crypto_hash VARCHAR(100) NOT NULL,
    issue_date VARCHAR(50) NOT NULL,
    trust_tier VARCHAR(30) DEFAULT 'verified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 15. INTERVIEW TELEMETRY (Closed-Loop Feedback from Recruiters to BoS)
-- -----------------------------------------------------------------------------
CREATE TABLE interview_telemetry (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    candidate_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('shortlist', 'offer', 'gap-found')),
    core_strengths TEXT NOT NULL,
    technical_deficits TEXT NOT NULL,
    sync_bos_dean BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_roll ON students(roll_no);
CREATE INDEX idx_student_skills_student ON student_skills(student_id);
CREATE INDEX idx_student_skills_skill ON student_skills(skill_id);
CREATE INDEX idx_internships_company ON internships(company_id);
CREATE INDEX idx_internship_req_internship ON internship_requirements(internship_id);
CREATE INDEX idx_syllabus_proposals_status ON syllabus_proposals(status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_certifications_student ON student_certifications(student_id);
CREATE INDEX idx_telemetry_student ON interview_telemetry(student_id);
