/* ==========================================================================
   SkillBridge Platform Core Engine - SIH 2026 (PS ID: SIH26044)
   Team: Tech Warriors
   Comprehensive Systems: Student Matching, Gap Fixing, Development,
   Company Recruiter Hub, and Advanced Faculty & Academia Administration.
   ========================================================================== */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 0. BACKEND API CLIENT (Node.js / Express / PostgreSQL on port 5000)
  // ---------------------------------------------------------------------------
  const API_BASE = (typeof window !== 'undefined' && window.SKILLBRIDGE_API_URL) || 'http://localhost:5000';

  const ApiClient = {
    baseUrl: API_BASE,
    isConnected: false,

    async request(endpoint, options = {}) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-demo-role': 'student',
            'x-user-id': 'u-student-1',
            ...(options.headers || {})
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        // Fall back gracefully to offline state
        return null;
      }
    },

    async checkHealth() {
      const res = await this.request('/api/health');
      if (res && res.status === 'healthy') {
        this.isConnected = true;
        return res;
      }
      this.isConnected = false;
      return null;
    },

    async getStudentProfile() {
      return this.request('/api/v1/students/profile');
    },

    async getCohort() {
      return this.request('/api/v1/students/cohort');
    },

    async getInternships() {
      return this.request('/api/v1/internships');
    },

    async getMatchingBreakdown(studentId, internshipId) {
      return this.request(`/api/v1/matching/explain?studentId=${studentId}&internshipId=${internshipId}`);
    },

    async submitAssessment(skillCode, answers) {
      return this.request(`/api/v1/skills/${skillCode}/assessment`, {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
    },

    async verifyCertificate(certData) {
      return this.request('/api/v1/students/verify-certificate', {
        method: 'POST',
        body: JSON.stringify(certData)
      });
    },

    async recordTelemetry(telemetryData) {
      return this.request('/api/v1/companies/telemetry', {
        method: 'POST',
        body: JSON.stringify(telemetryData)
      });
    },

    async submitProposal(proposalData) {
      return this.request('/api/v1/institutions/syllabus-proposals', {
        method: 'POST',
        body: JSON.stringify(proposalData)
      });
    },

    async enrollEvent(eventId) {
      return this.request(`/api/v1/events/${eventId}/enroll`, {
        method: 'POST'
      });
    }
  };

  function updateBackendStatusUI(isConnected, detail = '') {
    const badge = document.getElementById('backend-status-badge');
    const text = document.getElementById('backend-status-text');
    if (!badge || !text) return;

    if (isConnected) {
      badge.className = 'backend-badge online';
      text.textContent = 'Backend: Live (Port 5000)';
      badge.title = `SkillBridge Backend Connected • ${detail || 'WVSE-v2 Active'}`;
    } else {
      badge.className = 'backend-badge offline';
      text.textContent = 'Backend: Standalone Mode';
      badge.title = 'Backend offline or booting. Operating on high-performance in-browser engine.';
    }
  }

  async function syncWithBackend() {
    const health = await ApiClient.checkHealth();
    if (health) {
      updateBackendStatusUI(true, health.database_mode);
      showToast('🟢 Connected to SkillBridge Backend API (Port 5000)! Live WVSE-v2 engine active.', 'success');

      // Sync student profile / live-tracking from backend
      try {
        const liveRes = await ApiClient.request('/api/v1/students/live-tracking');
        if (liveRes && liveRes.success && liveRes.data && liveRes.data.student) {
          const s = liveRes.data.student;
          const studentObj = {
            isRegistered: true,
            id: s.id,
            name: s.name,
            rollNo: s.roll_no,
            institution: s.institution_name || 'National Institute of Technology',
            department: s.department || 'Computer Science & Engineering',
            semester: s.semester || '7th Semester',
            cgpa: s.cgpa || 8.5,
            overallReadiness: liveRes.data.overall_readiness || s.overall_readiness || 75,
            verifiedBadgesCount: s.verified_badges_count || 2,
            criticalGapsCount: liveRes.data.critical_gaps ? liveRes.data.critical_gaps.length : (s.critical_gaps_count || 1),
            radarScores: {
              prog: liveRes.data.radar?.programming || s.radar_prog || 75,
              web: liveRes.data.radar?.web_development || s.radar_web || 75,
              db: liveRes.data.radar?.databases || s.radar_db || 70,
              cloud: liveRes.data.radar?.cloud_devops || s.radar_cloud || 40,
              system: liveRes.data.radar?.system_architecture || s.radar_system || 50,
              soft: liveRes.data.radar?.soft_skills || s.radar_soft || 80
            },
            targetCompany: s.target_company || 'TechNova Solutions (Full Stack)'
          };

          const creds = {
            username: s.roll_no,
            password: '••••••••',
            student_name: s.name,
            roll_no: s.roll_no,
            issue_date: s.created_at
          };

          applyLiveStudentData(studentObj, creds, true);
        } else {
          // Backend has 0 students registered. If no local session, show empty slate!
          const localAuth = localStorage.getItem('skillbridge_auth_student');
          if (!localAuth) {
            updateLiveStudentSessionUI();
            updateExecutiveMetrics();
          }
        }
      } catch (e) {
        console.warn('Profile sync error:', e);
      }

      // Sync proposals from backend
      try {
        const propRes = await ApiClient.request('/api/v1/institutions/syllabus-proposals');
        if (propRes && propRes.success && propRes.data && propRes.data.length > 0) {
          propRes.data.forEach(p => {
            if (!state.syllabusProposals.some(sp => sp.id === p.id)) {
              state.syllabusProposals.unshift({
                id: p.id,
                title: p.title,
                proposedBy: p.proposer_name,
                targetDean: 'Dr. S. K. Mukherjee (Dean of Academics)',
                date: new Date(p.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                deficitStat: p.deficit_justification,
                rationale: `Proposed for ${p.department} curriculum revision.`,
                status: p.status === 'approved' ? 'Approved by BoS' : 'Under Review by Dean Dr. S. K. Mukherjee',
                statusClass: p.status === 'approved' ? 'approved' : 'review'
              });
            }
          });
          renderSyllabusProposals();
        }
      } catch (e) {
        console.warn('Proposals sync error:', e);
      }
    } else {
      updateBackendStatusUI(false);
    }
  }

  // ---------------------------------------------------------------------------
  // 1B. LIVE STUDENT INTAKE, CREDENTIAL ISSUANCE & SESSION MANAGEMENT
  // ---------------------------------------------------------------------------

  function recalculateCompanyMatches(student) {
    if (!student || !student.radarScores) return;
    const radar = student.radarScores;

    state.companies.forEach(c => {
      const b = c.benchmark;
      const progRatio = Math.min(1.05, radar.prog / (b.prog || 80));
      const webRatio = Math.min(1.05, radar.web / (b.web || 80));
      const dbRatio = Math.min(1.05, radar.db / (b.db || 80));
      const cloudRatio = Math.min(1.05, radar.cloud / (b.cloud || 75));
      const systemRatio = Math.min(1.05, radar.system / (b.system || 70));
      const softRatio = Math.min(1.05, radar.soft / (b.soft || 80));

      const weightedScore = Math.round(
        (progRatio * 0.22 + webRatio * 0.22 + dbRatio * 0.18 + cloudRatio * 0.16 + systemRatio * 0.12 + softRatio * 0.10) * 100
      );

      c.matchScore = Math.min(99, Math.max(25, weightedScore));
      c.tier = c.matchScore >= 85 ? 'high' : (c.matchScore >= 70 ? 'moderate' : 'target');

      if (c.matchScore >= 85) {
        c.explainableReason = `High vector alignment on ${c.category} competencies (+${c.matchScore}%). Qualified for direct corporate interview fast-track.`;
      } else if (c.matchScore >= 70) {
        c.explainableReason = `Strong foundational fit. Deficit in ${radar.cloud < 60 ? 'Cloud/DevOps' : 'System Design'} (-${100 - c.matchScore}%). Complete recommended gap bridging to unlock Tier 1.`;
      } else {
        c.explainableReason = `Emerging candidate profile. Significant gap against ${c.name} benchmark in ${radar.cloud < 60 ? 'DevOps & Containers' : 'Core Architecture'}. Roadmap bridging recommended.`;
      }

      if (c.requiredSkillGaps) {
        c.requiredSkillGaps.forEach(g => {
          let studentVal = 50;
          if (g.category === 'Programming' || g.category === 'DSA') studentVal = radar.prog;
          else if (g.category === 'Web') studentVal = radar.web;
          else if (g.category === 'Databases') studentVal = radar.db;
          else if (g.category === 'DevOps' || g.category === 'Cloud') studentVal = radar.cloud;
          else if (g.category === 'Architecture') studentVal = radar.system;
          else studentVal = radar.soft;

          g.cur = studentVal;
          if (studentVal >= g.req) {
            g.severity = 'verified';
            g.trustTier = 'verified';
          } else if (g.req - studentVal > 25) {
            g.severity = 'critical';
            g.trustTier = 'assessed';
          } else {
            g.severity = 'recommended';
            g.trustTier = 'assessed';
          }
        });
      }
    });
  }

  function updateLiveStudentSessionUI() {
    const s = state.student;
    const isRegistered = s && s.isRegistered;

    const avatarEl = document.getElementById('current-student-avatar');
    const nameEl = document.getElementById('current-student-name');
    const badgeEl = document.getElementById('current-student-status-badge');
    const metaEl = document.getElementById('current-student-meta');

    const navAvatar = document.getElementById('nav-avatar');
    const navName = document.getElementById('nav-user-name');
    const navTag = document.getElementById('nav-user-tag');

    if (isRegistered) {
      const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
      if (avatarEl) {
        avatarEl.textContent = initials;
        avatarEl.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      }
      if (nameEl) nameEl.textContent = s.name;
      if (badgeEl) {
        badgeEl.textContent = 'Live Session Active';
        badgeEl.className = 'student-session-pill verified';
      }
      if (metaEl) {
        metaEl.textContent = `${s.rollNo || s.roll_no} • ${s.department || 'B.Tech CSE'} • ${s.institution || 'NIT'} • CGPA ${s.cgpa || '8.5'}`;
      }

      if (navAvatar) {
        navAvatar.textContent = initials;
        navAvatar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      }
      if (navName) navName.textContent = s.name;
      if (navTag) navTag.textContent = `${s.rollNo || s.roll_no} • Online`;

      const certRecipient1 = document.getElementById('cert-card-recipient');
      if (certRecipient1) certRecipient1.textContent = s.name;
      const certRecipient2 = document.getElementById('cert-recipient-name');
      if (certRecipient2) certRecipient2.textContent = s.name;
      const auditStudent = document.getElementById('faculty-audit-student-name');
      if (auditStudent) auditStudent.textContent = s.name;
      const auditUsn = document.getElementById('faculty-audit-student-usn');
      if (auditUsn) auditUsn.textContent = `Roll: ${s.rollNo || s.roll_no}`;
      const feedCandidate = document.getElementById('feedback-candidate-name');
      if (feedCandidate) feedCandidate.value = `${s.name} (${s.rollNo || s.roll_no})`;
    } else {
      if (avatarEl) {
        avatarEl.textContent = '🎓';
        avatarEl.style.background = 'var(--bg-card-hover)';
      }
      if (nameEl) nameEl.textContent = 'No Student Registered';
      if (badgeEl) {
        badgeEl.textContent = 'Awaiting Live Intake';
        badgeEl.className = 'student-session-pill unverified';
      }
      if (metaEl) {
        metaEl.textContent = 'Register your live details or sign in with issued credentials to launch real-time WVSE-v2 tracking';
      }

      if (navAvatar) {
        navAvatar.textContent = '🎓';
        navAvatar.style.background = '';
      }
      if (navName) navName.textContent = 'Guest Student';
      if (navTag) navTag.textContent = 'Click to Register / Login';
    }
  }

  function applyLiveStudentData(student, creds, saveLocal = true) {
    state.student = student;
    if (creds) state.activeStudentCredentials = creds;

    if (saveLocal) {
      localStorage.setItem('skillbridge_auth_student', JSON.stringify({ student, credentials: creds }));
    }

    recalculateCompanyMatches(student);

    state.facultyStudents = [
      {
        id: student.id || 'f-s1',
        name: student.name,
        roll: student.rollNo,
        branch: `${student.department || 'B.Tech CSE'} • ${student.semester || '7th Sem'}`,
        cgpa: student.cgpa || 8.5,
        readiness: student.overallReadiness,
        trend: '+5% this month',
        status: student.overallReadiness >= 85 ? 'ready' : (student.overallReadiness >= 70 ? 'bridging' : 'support'),
        statusLabel: student.overallReadiness >= 85 ? 'Placement Ready (>85%)' : (student.overallReadiness >= 70 ? 'In Active Bridging' : 'Academic Support Needed'),
        verifiedBadges: ['Live Intake Verified', 'WVSE Algorithmic Calibrated'],
        buildingNow: student.targetCompany || 'Full Stack & Cloud Architecture',
        radar: student.radarScores,
        targetCompany: student.targetCompany || 'TechNova Solutions'
      }
    ];

    state.recruiterCandidates = [
      {
        id: 'c1',
        name: `${student.name} (Live Candidate)`,
        roll: student.rollNo,
        gpa: `${student.cgpa || 8.5} CGPA`,
        readiness: student.overallReadiness,
        tier: student.overallReadiness >= 85 ? 'Tier 1: Interview Ready' : (student.overallReadiness >= 70 ? 'Tier 2: Pre-Screened' : 'Tier 3: Emerging Talent'),
        tierClass: student.overallReadiness >= 85 ? 'tier-high' : (student.overallReadiness >= 70 ? 'tier-moderate' : 'tier-target'),
        radarMatch: student.overallReadiness,
        badges: ['Intake Verified', 'Algorithmic Match Active'],
        keyStrengths: `Programming (${student.radarScores.prog}%), Web (${student.radarScores.web}%), DB (${student.radarScores.db}%)`,
        gapAlert: student.radarScores.cloud < 60 ? 'Cloud & DevOps Deficit' : 'Continuous Integration',
        status: 'Profile Active • Open for Matching'
      }
    ];

    updateLiveStudentSessionUI();
    updateExecutiveMetrics();
    renderCompanyMatchingList();
    renderRadarChart(state.selectedCompanyId);
    renderSkillGapSection();
    renderRoadmaps();
    renderRecruiterPortal();
    renderFacultyStudents();
  }

  function openRegisterModal() {
    const modal = document.getElementById('student-register-modal');
    if (modal) modal.classList.add('active');
  }

  function closeRegisterModal() {
    const modal = document.getElementById('student-register-modal');
    if (modal) modal.classList.remove('active');
  }

  function openLoginModal() {
    const modal = document.getElementById('student-login-modal');
    if (modal) modal.classList.add('active');
  }

  function closeLoginModal() {
    const modal = document.getElementById('student-login-modal');
    if (modal) modal.classList.remove('active');
  }

  function openCredentialsModal(creds) {
    const modal = document.getElementById('student-credentials-modal');
    if (!modal) return;

    const nameEl = document.getElementById('cred-display-name') || document.getElementById('cred-student-name');
    const userEl = document.getElementById('cred-display-username') || document.getElementById('cred-username');
    const passEl = document.getElementById('cred-display-password') || document.getElementById('cred-password');
    const metaEl = document.getElementById('cred-display-meta');
    const dateEl = document.getElementById('cred-issue-date');

    const sName = creds.student_name || creds.name || state.student?.name || 'Student';
    const sUser = creds.username || creds.roll_no || state.student?.rollNo || 'USERNAME';
    const sPass = creds.password || '••••••••';

    if (nameEl) nameEl.textContent = sName;
    if (userEl) userEl.textContent = sUser;
    if (passEl) passEl.textContent = sPass;
    if (metaEl) metaEl.textContent = `${sUser} • ${state.student?.department || 'Computer Science & Engineering'}`;
    if (dateEl) {
      const d = creds.issue_date ? new Date(creds.issue_date) : new Date();
      dateEl.textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    modal.classList.add('active');
  }

  function closeCredentialsModal() {
    const modal = document.getElementById('student-credentials-modal');
    if (!modal) return;
    modal.classList.remove('active');
  }

  function copyCredentials() {
    const user = document.getElementById('cred-display-username')?.textContent || document.getElementById('cred-username')?.textContent || '';
    const pass = document.getElementById('cred-display-password')?.textContent || document.getElementById('cred-password')?.textContent || '';
    const name = document.getElementById('cred-display-name')?.textContent || document.getElementById('cred-student-name')?.textContent || '';

    const textToCopy = `SkillBridge Student Access Card\n--------------------------------\nStudent: ${name}\nUsername: ${user}\nPassword: ${pass}\nPortal: http://localhost:5000\n--------------------------------`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtn = document.querySelector('.btn-copy-creds') || document.getElementById('btn-copy-creds');
        const copyText = document.getElementById('copy-creds-text');
        if (copyText) copyText.textContent = 'Copied to Clipboard! ✓';
        if (copyBtn && !copyText) copyBtn.textContent = '✓ Copied to Clipboard!';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copy Credentials to Clipboard';
          if (copyBtn && !copyText) copyBtn.textContent = '📋 Copy Access Credentials';
        }, 2500);
        showToast('📋 Credentials copied to clipboard!', 'success');
      }).catch(() => {
        showToast(`Username: ${user} | Password: ${pass}`, 'info');
      });
    } else {
      showToast(`Username: ${user} | Password: ${pass}`, 'info');
    }
  }

  function launchLiveTrackingFromModal() {
    closeCredentialsModal();
    window.SkillBridge.switchPerspective('student');
    const studentSec = document.getElementById('portal-student');
    if (studentSec) {
      studentSec.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`🎯 Live tracking dashboard activated for ${state.student.name}!`, 'success');
  }

  function handleUserChipClick() {
    if (state.student && state.student.isRegistered && state.activeStudentCredentials) {
      openCredentialsModal(state.activeStudentCredentials);
    } else {
      openRegisterModal();
    }
  }

  async function submitStudentRegistration() {
    const nameInput = document.getElementById('reg-student-name');
    const rollInput = document.getElementById('reg-student-roll');
    const collegeInput = document.getElementById('reg-student-institution') || document.getElementById('reg-student-college');
    const deptInput = document.getElementById('reg-student-department') || document.getElementById('reg-student-dept');
    const semInput = document.getElementById('reg-student-semester') || document.getElementById('reg-student-sem');
    const cgpaInput = document.getElementById('reg-student-cgpa');
    const roleInput = document.getElementById('reg-target-company') || document.getElementById('reg-target-role');
    const customPassInput = document.getElementById('reg-student-password') || document.getElementById('reg-custom-password');

    const name = nameInput ? nameInput.value.trim() : '';
    const rollNo = rollInput ? rollInput.value.trim().toUpperCase() : '';
    if (!name || !rollNo) {
      showToast('⚠️ Please provide Student Full Name and Roll Number / ID.', 'error');
      if (!name && nameInput) nameInput.focus();
      else if (rollInput) rollInput.focus();
      return;
    }

    const institution = collegeInput ? collegeInput.value.trim() : 'National Institute of Technology';
    const department = deptInput ? deptInput.value.trim() : 'Computer Science & Engineering';
    const semester = semInput ? semInput.value : '7th Semester';
    const year = semester.includes('7') || semester.includes('8') ? '4th Year' : (semester.includes('5') || semester.includes('6') ? '3rd Year' : '2nd Year');
    const cgpa = cgpaInput ? parseFloat(cgpaInput.value) || 8.5 : 8.5;
    const targetRole = roleInput ? roleInput.value : 'TechNova Solutions (Full Stack)';
    const customPassword = customPassInput ? customPassInput.value.trim() : '';

    const prog = parseInt(document.getElementById('reg-skill-prog')?.value, 10) || 75;
    const web = parseInt(document.getElementById('reg-skill-web')?.value, 10) || 75;
    const db = parseInt(document.getElementById('reg-skill-db')?.value, 10) || 70;
    const cloud = parseInt(document.getElementById('reg-skill-cloud')?.value, 10) || 40;
    const system = parseInt(document.getElementById('reg-skill-system')?.value, 10) || 50;
    const soft = parseInt(document.getElementById('reg-skill-soft')?.value, 10) || 80;

    const payload = {
      name,
      roll_no: rollNo,
      institution_name: institution,
      department,
      semester: `${semester} (${year})`,
      cgpa,
      target_company: targetRole,
      password: customPassword,
      radar_prog: prog,
      radar_web: web,
      radar_db: db,
      radar_cloud: cloud,
      radar_system: system,
      radar_soft: soft
    };

    let registeredData = null;
    let creds = null;

    try {
      const response = await ApiClient.request('/api/v1/students/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response && response.success) {
        registeredData = (response.data && response.data.student) || response.student;
        creds = (response.data && response.data.credentials) || response.credentials;
        const authToken = (response.data && response.data.token) || response.token;
        if (authToken) {
          localStorage.setItem('skillbridge_auth_token', authToken);
        }
      }
    } catch (err) {
      console.warn('Backend offline or error, generating local credentials:', err);
    }

    if (!registeredData) {
      const generatedPassword = customPassword && customPassword.length >= 4
        ? customPassword
        : `SKILL-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

      const overallReadiness = Math.round((prog + web + db + cloud + system + soft) / 6);
      const criticalGapsCount = (cloud < 60 ? 1 : 0) + (system < 60 ? 1 : 0);

      registeredData = {
        id: `s-${Date.now()}`,
        name,
        roll_no: rollNo,
        institution_name: institution,
        department,
        semester: `${semester} (${year})`,
        cgpa,
        overall_readiness: overallReadiness,
        verified_badges_count: 2,
        critical_gaps_count: criticalGapsCount,
        radar_prog: prog,
        radar_web: web,
        radar_db: db,
        radar_cloud: cloud,
        radar_system: system,
        radar_soft: soft,
        target_company: targetRole
      };

      creds = {
        username: rollNo,
        password: generatedPassword,
        student_name: name,
        roll_no: rollNo,
        issue_date: new Date().toISOString()
      };
    }

    const student = {
      isRegistered: true,
      id: registeredData.id,
      name: registeredData.name,
      rollNo: registeredData.roll_no,
      institution: registeredData.institution_name || institution,
      department: registeredData.department,
      semester: registeredData.semester,
      cgpa: registeredData.cgpa,
      overallReadiness: registeredData.overall_readiness,
      verifiedBadgesCount: registeredData.verified_badges_count || 2,
      criticalGapsCount: registeredData.critical_gaps_count !== undefined ? registeredData.critical_gaps_count : 1,
      radarScores: {
        prog: registeredData.radar_prog || prog,
        web: registeredData.radar_web || web,
        db: registeredData.radar_db || db,
        cloud: registeredData.radar_cloud || cloud,
        system: registeredData.radar_system || system,
        soft: registeredData.radar_soft || soft
      },
      targetCompany: targetRole
    };

    applyLiveStudentData(student, creds, true);
    closeRegisterModal();
    openCredentialsModal(creds);
    showToast(`🎉 Registration complete for ${name}! Credentials issued.`, 'success');
  }

  async function submitStudentLogin() {
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const username = userInput ? userInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!username || !password) {
      showToast('⚠️ Please enter both Username / Roll No and Password.', 'error');
      return;
    }

    try {
      const response = await ApiClient.request('/api/v1/students/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (response && response.success) {
        const studentRec = (response.data && response.data.student) || response.student;
        if (studentRec) {
          const student = {
            isRegistered: true,
            id: studentRec.id,
            name: studentRec.name,
            rollNo: studentRec.roll_no,
            institution: studentRec.institution_name,
            department: studentRec.department,
            semester: studentRec.semester,
            cgpa: studentRec.cgpa,
            overallReadiness: studentRec.overall_readiness,
            verifiedBadgesCount: studentRec.verified_badges_count || 2,
            criticalGapsCount: studentRec.critical_gaps_count !== undefined ? studentRec.critical_gaps_count : 1,
            radarScores: {
              prog: studentRec.radar_prog || 75,
              web: studentRec.radar_web || 75,
              db: studentRec.radar_db || 70,
              cloud: studentRec.radar_cloud || 40,
              system: studentRec.radar_system || 50,
              soft: studentRec.radar_soft || 80
            },
            targetCompany: studentRec.target_company
          };

          const usernameVal = (response.data && response.data.credentials && response.data.credentials.username) || 
                              (response.credentials && response.credentials.username) || 
                              (response.data && response.data.user && response.data.user.username) || 
                              username;

          const creds = {
            username: usernameVal,
            password: password,
            student_name: student.name,
            roll_no: student.rollNo,
            issue_date: new Date().toISOString()
          };

          const authToken = (response.data && response.data.token) || response.token;
          if (authToken) {
            localStorage.setItem('skillbridge_auth_token', authToken);
          }

          applyLiveStudentData(student, creds, true);
          closeLoginModal();
          showToast(`🔓 Welcome back, ${student.name}! Live tracking loaded.`, 'success');
          return;
        }
      }
    } catch (err) {
      const saved = localStorage.getItem('skillbridge_auth_student');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.credentials && parsed.credentials.username.toUpperCase() === username.toUpperCase() && parsed.credentials.password === password) {
            applyLiveStudentData(parsed.student, parsed.credentials, false);
            closeLoginModal();
            showToast(`🔓 Welcome back, ${parsed.student.name}! (Offline Session Restored)`, 'success');
            return;
          }
        } catch (e) {}
      }
      showToast('❌ Authentication failed. Invalid username or password.', 'error');
    }
  }

  async function resetStudentDataPrompt() {
    const confirmWipe = confirm(
      "Are you sure you want to clear all student records?\n\nThis will wipe any currently registered live student and reset the system back to a clean slate, allowing you to demonstrate a fresh manual student data intake."
    );
    if (!confirmWipe) return;

    try {
      await ApiClient.request('/api/v1/students/reset-data', { method: 'POST' });
    } catch (e) {
      console.warn('Backend reset error or offline:', e);
    }

    localStorage.removeItem('skillbridge_auth_student');
    localStorage.removeItem('skillbridge_auth_token');

    state.student = {
      isRegistered: false,
      name: "No Student Registered",
      rollNo: "Awaiting Live Intake",
      institution: "National Institute of Technology",
      department: "Computer Science & Engineering",
      semester: "Semester --",
      overallReadiness: 0,
      verifiedBadgesCount: 0,
      criticalGapsCount: 0,
      testsPassed: 0,
      radarScores: { prog: 0, web: 0, db: 0, cloud: 0, system: 0, soft: 0 },
      skills: []
    };
    state.activeStudentCredentials = null;
    state.facultyStudents = [];
    state.recruiterCandidates = [];

    state.companies.forEach(c => {
      c.matchScore = 0;
      c.tier = 'target';
    });

    updateLiveStudentSessionUI();
    updateExecutiveMetrics();
    renderCompanyMatchingList();
    renderRadarChart(state.selectedCompanyId);
    renderSkillGapSection();
    renderRoadmaps();
    renderRecruiterPortal();
    renderFacultyStudents();

    showToast('🧹 All student data has been wiped. System is ready for live intake demonstration!', 'success');
  }

  // ---------------------------------------------------------------------------
  // 1. STATE MANAGEMENT & COMPREHENSIVE DATASETS
  // ---------------------------------------------------------------------------

  const state = {
    activePerspective: 'student',  // 'student' | 'company' | 'faculty'
    activeSystemTab: 'matching',   // 'matching' | 'gap-fixing' | 'development'
    activeDevSubtab: 'roadmaps',   // 'roadmaps' | 'labs' | 'tests' | 'mentors'
    activeFilterTier: 'all',       // 'all' | 'high' | 'moderate' | 'target'
    selectedCompanyId: 'technova',
    selectedRecruiterCompanyId: 'technova',
    searchQuery: '',

    // Faculty Portal State
    facultySubtab: 'students',     // 'students' | 'market-tech' | 'curriculum-gap' | 'collaboration' | 'fdps'
    facultyStudentFilter: 'all',   // 'all' | 'ready' | 'bridging' | 'support'
    facultyStudentSearch: '',
    
    // Dynamic student profile state (Initial clean slate for live intake demonstration)
    student: {
      isRegistered: false,
      name: "No Student Registered",
      rollNo: "Awaiting Live Intake",
      institution: "National Institute of Technology",
      department: "Computer Science & Engineering",
      semester: "Semester --",
      overallReadiness: 0,
      verifiedBadgesCount: 0,
      criticalGapsCount: 0,
      testsPassed: 0,
      radarScores: {
        prog: 0,
        web: 0,
        db: 0,
        cloud: 0,
        system: 0,
        soft: 0
      },
      skills: []
    },
    activeStudentCredentials: null,

    // Company Database with Benchmarks
    companies: [
      {
        id: 'technova',
        name: 'TechNova Solutions',
        brandLetter: 'TN',
        brandColor: 'linear-gradient(135deg, #0f172a, #2563eb)',
        roleTitle: 'Full Stack Cloud Engineer Intern + PPO',
        location: 'Bengaluru / Hybrid',
        stipend: '₹45,000 / mo',
        ppoPackage: '14.5 LPA',
        tier: 'moderate',
        matchScore: 84,
        category: 'Full Stack',
        explainableReason: 'Strong match on React, Node.js & SQL (+60%). Lacks production Docker & Kubernetes containerization (-16%).',
        matchedSkills: ['React.js', 'Node.js', 'SQL & PostgreSQL', 'Git', 'REST APIs'],
        missingSkills: ['Docker Containerization', 'Kubernetes', 'Microservices Architecture'],
        benchmark: {
          prog: 80,
          web: 85,
          db: 78,
          cloud: 75,
          system: 70,
          soft: 80
        },
        requiredSkillGaps: [
          { skill: 'React.js & State Management', category: 'Web', req: 85, cur: 88, severity: 'verified', weight: 25, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Faculty Endorsed & GitHub' },
          { skill: 'Node.js & Express REST APIs', category: 'Web', req: 80, cur: 82, severity: 'verified', weight: 25, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'SkillBridge Proctored Benchmark' },
          { skill: 'PostgreSQL Database Modeling', category: 'Databases', req: 75, cur: 80, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Cryptographic Certificate' },
          { skill: 'Docker Containerization', category: 'DevOps', req: 80, cur: 35, severity: 'critical', weight: 15, type: 'Core', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' },
          { skill: 'Kubernetes Cluster Basics', category: 'DevOps', req: 70, cur: 20, severity: 'critical', weight: 10, type: 'Elective', trustTier: 'self-declared', trustMultiplier: 0.40, evidence: 'Self-Reported Claim' },
          { skill: 'Microservices & Async Queues', category: 'Architecture', req: 75, cur: 40, severity: 'recommended', weight: 5, type: 'Elective', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' }
        ]
      },
      {
        id: 'datacore',
        name: 'DataCore Technologies',
        brandLetter: 'DC',
        brandColor: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        roleTitle: 'Data Systems & AI Associate',
        location: 'Hyderabad / On-site',
        stipend: '₹50,000 / mo',
        ppoPackage: '16.0 LPA',
        tier: 'high',
        matchScore: 89,
        category: 'AI & Data',
        explainableReason: 'Excellent Python, Algorithmic DSA, and Relational Modeling (+66%). Minor gap in Vector Search & PySpark (-11%).',
        matchedSkills: ['Python Scripting', 'Data Structures', 'SQL / DBMS', 'REST APIs', 'Git'],
        missingSkills: ['Vector DBs (Pinecone)', 'PySpark Big Data'],
        benchmark: {
          prog: 88,
          web: 65,
          db: 85,
          cloud: 60,
          system: 65,
          soft: 82
        },
        requiredSkillGaps: [
          { skill: 'Python Advanced & Data Structures', category: 'Programming', req: 85, cur: 86, severity: 'verified', weight: 30, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Faculty Endorsed & GitHub' },
          { skill: 'Relational DBMS & Query Optimization', category: 'Databases', req: 80, cur: 80, severity: 'verified', weight: 25, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Cryptographic Certificate' },
          { skill: 'REST API Integration', category: 'Web', req: 70, cur: 82, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'SkillBridge Proctored Benchmark' },
          { skill: 'Vector Databases & Embeddings', category: 'AI & Data', req: 75, cur: 45, severity: 'recommended', weight: 15, type: 'Elective', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' },
          { skill: 'Cloud Storage & ETL Pipelines', category: 'DevOps', req: 70, cur: 42, severity: 'recommended', weight: 10, type: 'Elective', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' }
        ]
      },
      {
        id: 'tcsresearch',
        name: 'TCS Research & Innovation',
        brandLetter: 'TR',
        brandColor: 'linear-gradient(135deg, #22c55e, #16a34a)',
        roleTitle: 'R&D Software Scientist Intern',
        location: 'Chennai / Pune',
        stipend: '₹40,000 / mo',
        ppoPackage: '11.5 LPA',
        tier: 'high',
        matchScore: 92,
        category: 'Systems',
        explainableReason: 'Exceeds institutional academic thresholds in Core CS, Algorithms, and Operating Systems (+78%). Direct interview eligible.',
        matchedSkills: ['DSA & Complexity', 'Operating Systems', 'Python', 'PostgreSQL', 'Agile Communication'],
        missingSkills: ['Research Paper Drafting'],
        benchmark: {
          prog: 82,
          web: 60,
          db: 75,
          cloud: 50,
          system: 65,
          soft: 85
        },
        requiredSkillGaps: [
          { skill: 'Data Structures & Algorithms', category: 'Programming', req: 80, cur: 85, severity: 'verified', weight: 30, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Faculty Endorsed & GitHub' },
          { skill: 'Operating Systems & Concurrency', category: 'Systems', req: 75, cur: 75, severity: 'verified', weight: 25, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Faculty BoS Transcript' },
          { skill: 'Relational Database Design', category: 'Databases', req: 70, cur: 80, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Cryptographic Certificate' },
          { skill: 'Analytical Problem Solving', category: 'Aptitude', req: 80, cur: 88, severity: 'verified', weight: 15, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'SkillBridge Proctored Benchmark' },
          { skill: 'Technical Research Methodology', category: 'Academic', req: 70, cur: 48, severity: 'recommended', weight: 10, type: 'Elective', trustTier: 'self-declared', trustMultiplier: 0.40, evidence: 'Self-Reported Claim' }
        ]
      },
      {
        id: 'zoho',
        name: 'Zoho Corporation',
        brandLetter: 'ZH',
        brandColor: 'linear-gradient(135deg, #ef4444, #dc2626)',
        roleTitle: 'Product Software Engineer - Backend',
        location: 'Chennai / Tenkasi',
        stipend: '₹38,000 / mo',
        ppoPackage: '12.0 LPA',
        tier: 'high',
        matchScore: 86,
        category: 'Full Stack',
        explainableReason: 'Superior problem-solving foundations and clean API design (+72%). Requires Redis In-memory Caching (-14%).',
        matchedSkills: ['Data Structures & Logic', 'Node.js', 'SQL Normalization', 'REST APIs'],
        missingSkills: ['Redis In-Memory Caching', 'Java Multi-threading'],
        benchmark: {
          prog: 86,
          web: 75,
          db: 82,
          cloud: 55,
          system: 75,
          soft: 80
        },
        requiredSkillGaps: [
          { skill: 'Core Algorithm Implementation', category: 'Programming', req: 85, cur: 85, severity: 'verified', weight: 30, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Faculty Endorsed & GitHub' },
          { skill: 'Backend RESTful Service Design', category: 'Web', req: 78, cur: 82, severity: 'verified', weight: 25, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'SkillBridge Proctored Benchmark' },
          { skill: 'Database Query Optimization', category: 'Databases', req: 80, cur: 80, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Cryptographic Certificate' },
          { skill: 'Redis Distributed Caching', category: 'Architecture', req: 75, cur: 42, severity: 'critical', weight: 15, type: 'Core', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' },
          { skill: 'High-Concurrency Multi-threading', category: 'Systems', req: 70, cur: 50, severity: 'recommended', weight: 10, type: 'Elective', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' }
        ]
      },
      {
        id: 'aws',
        name: 'Amazon Web Services (AWS)',
        brandLetter: 'AW',
        brandColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
        roleTitle: 'Cloud Solutions Associate Intern',
        location: 'Bengaluru / Hyderabad',
        stipend: '₹65,000 / mo',
        ppoPackage: '22.0 LPA',
        tier: 'target',
        matchScore: 68,
        category: 'Cloud & DevOps',
        explainableReason: 'Solid core programming & Linux foundations (+48%). Critical gap in AWS VPC, IAM, and Terraform Infrastructure (-32%).',
        matchedSkills: ['Python', 'DSA Basics', 'Git', 'API Architecture'],
        missingSkills: ['AWS Solutions Architecture', 'Docker & ECS', 'Terraform (IaC)', 'CI/CD Pipelines'],
        benchmark: {
          prog: 80,
          web: 70,
          db: 78,
          cloud: 88,
          system: 82,
          soft: 85
        },
        requiredSkillGaps: [
          { skill: 'Python / Bash Systems Scripting', category: 'Programming', req: 75, cur: 86, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'SkillBridge Proctored Benchmark' },
          { skill: 'REST API & Distributed Basics', category: 'Architecture', req: 75, cur: 80, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Cryptographic Certificate' },
          { skill: 'AWS IAM, VPC & EC2 Deployment', category: 'Cloud & DevOps', req: 85, cur: 45, severity: 'critical', weight: 25, type: 'Core', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' },
          { skill: 'Docker Container Deployment', category: 'Cloud & DevOps', req: 80, cur: 35, severity: 'critical', weight: 20, type: 'Core', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' },
          { skill: 'Terraform Infrastructure as Code', category: 'Cloud & DevOps', req: 75, cur: 25, severity: 'critical', weight: 15, type: 'Elective', trustTier: 'self-declared', trustMultiplier: 0.40, evidence: 'Self-Reported Claim' }
        ]
      },
      {
        id: 'googlecloud',
        name: 'Google Cloud Partner Labs',
        brandLetter: 'GC',
        brandColor: 'linear-gradient(135deg, #4285f4, #0f9d58)',
        roleTitle: 'Cloud AI & ML Systems Engineer',
        location: 'Bengaluru / Gurgaon',
        stipend: '₹70,000 / mo',
        ppoPackage: '24.0 LPA',
        tier: 'moderate',
        matchScore: 72,
        category: 'AI & Data',
        explainableReason: 'Solid math & Python backend skills (+52%). Deficit in Vertex AI pipelines, GKE Kubernetes deployment (-28%).',
        matchedSkills: ['Python', 'DSA', 'SQL Modeling', 'Git'],
        missingSkills: ['Vertex AI Pipelines', 'Google Kubernetes Engine (GKE)', 'Docker Production'],
        benchmark: {
          prog: 88,
          web: 70,
          db: 80,
          cloud: 85,
          system: 85,
          soft: 85
        },
        requiredSkillGaps: [
          { skill: 'Python & Data Structures', category: 'Programming', req: 85, cur: 86, severity: 'verified', weight: 25, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Faculty Endorsed & GitHub' },
          { skill: 'SQL & Data Warehouse Basics', category: 'Databases', req: 75, cur: 80, severity: 'verified', weight: 20, type: 'Core', trustTier: 'verified', trustMultiplier: 1.0, evidence: 'Cryptographic Certificate' },
          { skill: 'GKE Kubernetes Deployments', category: 'Cloud & DevOps', req: 82, cur: 20, severity: 'critical', weight: 20, type: 'Core', trustTier: 'self-declared', trustMultiplier: 0.40, evidence: 'Self-Reported Claim' },
          { skill: 'Docker Multi-stage Builds', category: 'Cloud & DevOps', req: 80, cur: 35, severity: 'critical', weight: 20, type: 'Core', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' },
          { skill: 'Vertex AI & MLOps Pipelines', category: 'AI & Data', req: 80, cur: 40, severity: 'critical', weight: 15, type: 'Elective', trustTier: 'assessed', trustMultiplier: 0.75, evidence: 'Platform Diagnostic Test' }
        ]
      }
    ],

    // Recruiter Candidates View (Company Perspective) - Starts clean, populated by live student registrations
    recruiterCandidates: [],

    // -------------------------------------------------------------------------
    // FACULTY DATASETS
    // -------------------------------------------------------------------------

    // 1. Comprehensive Student Cohort for Faculty Tracking - Starts clean, populated by live student registrations
    facultyStudents: [],

    // 2. Emerging Market Technologies vs Syllabus Coverage
    marketTechTrends: [
      {
        id: 'm1',
        title: 'Generative AI & LLMOps Pipelines',
        icon: '🤖',
        iconBg: '#eef2ff',
        surge: '+142% Hiring Surge',
        recruiterCount: '38 Hiring Partners',
        syllabusStatus: 'Zero Coverage (Missing)',
        syllabusStatusClass: 'none',
        syllabusNote: 'Not present in current 2022 Regulation syllabus. High risk for DataCore & TCS hiring.',
        recommendedCourse: 'New 8th-Sem Elective CSE-491: Generative AI & Vector Architectures'
      },
      {
        id: 'm2',
        title: 'Docker Containerization & Kubernetes',
        icon: '🐳',
        iconBg: '#ecfeff',
        surge: '+95% Demand Surge',
        recruiterCount: '44 Hiring Partners',
        syllabusStatus: 'Outdated / Theory Only',
        syllabusStatusClass: 'outdated',
        syllabusNote: '6th-sem OS course covers VMs only; zero practical container build labs.',
        recommendedCourse: 'Upgrade Lab Module in CSE-402: Cloud & Virtualization Lab'
      },
      {
        id: 'm3',
        title: 'Vector Databases (Pinecone, Milvus, Chroma)',
        icon: '⚡',
        iconBg: '#f5f3ff',
        surge: '+115% Demand Surge',
        recruiterCount: '29 Hiring Partners',
        syllabusStatus: 'Zero Coverage (Missing)',
        syllabusStatusClass: 'none',
        syllabusNote: 'DBMS syllabus restricted to B-Trees and relational SQL; no embeddings.',
        recommendedCourse: 'Special Module in CSE-304: Advanced Database Systems'
      },
      {
        id: 'm4',
        title: 'Distributed Caching (Redis) & Microservices',
        icon: '🔄',
        iconBg: '#fffbeb',
        surge: '+78% Demand Surge',
        recruiterCount: '33 Hiring Partners',
        syllabusStatus: 'Partial Coverage',
        syllabusStatusClass: 'partial',
        syllabusNote: 'Software Engineering covers monolithic architecture; needs message queues & Redis.',
        recommendedCourse: 'Hands-on Workshop Module for 7th Sem CSE-401'
      },
      {
        id: 'm5',
        title: 'Cloud Infrastructure as Code (Terraform)',
        icon: '☁️',
        iconBg: '#fff1f2',
        surge: '+84% Demand Surge',
        recruiterCount: '26 Hiring Partners',
        syllabusStatus: 'Zero Coverage (Missing)',
        syllabusStatusClass: 'none',
        syllabusNote: 'Crucial for AWS, Azure & DevOps consulting tracks.',
        recommendedCourse: 'Incorporate into Cloud Computing Elective CSE-482'
      },
      {
        id: 'm6',
        title: 'Rust for High-Performance Systems & Safety',
        icon: '🦀',
        iconBg: '#f1f5f9',
        surge: '+64% Demand Surge',
        recruiterCount: '19 Hiring Partners',
        syllabusStatus: 'Zero Coverage (Missing)',
        syllabusStatusClass: 'none',
        syllabusNote: 'Rapidly replacing C++ in systems infrastructure companies like Zoho & Cloudflare.',
        recommendedCourse: 'Propose Open Elective CSE-495: Systems Programming with Rust'
      }
    ],

    // 3. Syllabus Revision Proposals Submitted to Dean
    syllabusProposals: [
      {
        id: 'BOS-REV-2026-084',
        title: 'Inclusion of Production Docker Containerization & Kubernetes in CSE-402',
        proposedBy: 'Prof. R. Sharma (CSE Faculty Admin)',
        targetDean: 'Dr. S. K. Mukherjee (Dean of Academics)',
        date: '02 Sep 2026',
        deficitStat: '68% Batch Deficit (82 Students Lacking Required Recruiter Skills)',
        rationale: 'Mandatory benchmark cutoff for TechNova, AWS, and Google Cloud internship hiring.',
        status: 'Under Review by Dean Dr. S. K. Mukherjee',
        statusClass: 'review'
      },
      {
        id: 'BOS-REV-2026-079',
        title: 'New 8th-Sem Elective: Enterprise Vector Search & Generative AI Systems',
        proposedBy: 'Dr. Meenakshi Sundaram (Assoc. Prof)',
        targetDean: 'Dr. S. K. Mukherjee (Dean of Academics)',
        date: '28 Aug 2026',
        deficitStat: '72% Deficit across AI & Data Recruiter Benchmarks',
        rationale: 'DataCore & TCS corporate hiring requirements for high CTC roles (16+ LPA).',
        status: 'Ratified by Academic Council (Approved for Batch 2026)',
        statusClass: 'approved'
      }
    ],

    // 4. Faculty Industry Collaboration (Sabbaticals, Challenges, R&D)
    facultyCollaboration: {
      sabbaticals: [
        {
          id: 'sab-1',
          company: 'TechNova Solutions',
          title: 'Cloud Architecture & Kubernetes Faculty Immersion',
          duration: '6 Weeks (Summer/Winter Break)',
          location: 'Bengaluru / Hybrid',
          stipend: '₹75,000 / month',
          eligibility: 'Assistant & Associate Professors (CSE/IT)',
          focus: 'Container security, service mesh, and enterprise microservices orchestration.'
        },
        {
          id: 'sab-2',
          company: 'Zoho Corporation',
          title: 'High-Concurrency Product Systems Faculty Sabbatical',
          duration: '8 Weeks',
          location: 'Chennai Campus',
          stipend: '₹85,000 / month',
          eligibility: 'Faculty with 3+ Years Systems / OS Teaching',
          focus: 'Low-latency in-memory databases, compiler optimization, and distributed storage.'
        }
      ],
      consultingChallenges: [
        {
          id: 'chal-1',
          code: 'R&D Challenge #104',
          company: 'TechNova Solutions',
          title: 'Low-Latency Vector Indexing for GenAI Search',
          grant: '₹3.5 Lakhs Consulting Grant',
          timeline: '4 Months Project Duration',
          description: 'Design an approximate nearest neighbor (ANN) quantization algorithm for multi-tenant SaaS search.'
        },
        {
          id: 'chal-2',
          code: 'Robotics Challenge #88',
          company: 'CloudWave Robotics',
          title: 'Edge Vision Pipeline for Autonomous Warehouse AGVs',
          grant: '₹5.0 Lakhs Research Grant',
          timeline: '6 Months Project Duration',
          description: 'Deploy real-time obstacle avoidance on embedded Jetson Orin modules with under 15ms inference latency.'
        }
      ],
      jointResearch: [
        {
          id: 'rnd-1',
          professor: 'Dr. K. Ramanathan (HoD, CSE)',
          project: 'Tata R&D Hybrid Multi-Cloud Container Mesh Resilience',
          budget: '₹12.5 Lakhs (Corporate Sponsored Research Grant)',
          duration: '1 Year Academic-Industry Partnership',
          deliverable: 'Joint Patent Application + 2 IEEE Transactions Publications'
        },
        {
          id: 'rnd-2',
          professor: 'Dr. Meenakshi Sundaram (Assoc. Prof)',
          project: 'DataCore Enterprise Semantic Search Optimization',
          budget: '₹9.0 Lakhs (Joint Lab Co-Development)',
          duration: '9 Months Academic Partnership',
          deliverable: 'Industrial Open Source Library + Faculty-Student Research Paper'
        }
      ]
    },

    // 5. Corporate Faculty Development Programs (FDP)
    facultyFDPs: [
      {
        id: 'fdp-1',
        company: 'TechNova Solutions',
        badge: 'Industry Certified FDP',
        title: '5-Day Corporate FDP: Production Microservices & Kubernetes',
        date: 'Sep 18 – 22, 2026',
        mode: 'Hybrid (Campus Virtual Lab + Live Corporate Architect Sessions)',
        benefits: 'Co-branded Faculty Certificate, Hands-on Cloud Sandboxes, Free Courseware for College',
        status: 'Open for Enrollment'
      },
      {
        id: 'fdp-2',
        company: 'Google Cloud Education',
        badge: 'Google Certified Educator',
        title: 'Faculty Masterclass: Vertex AI & Generative Agents in Higher Ed',
        date: 'Oct 05 – 08, 2026',
        mode: 'Virtual Lab (Interactive Google Cloud Sandbox Provided)',
        benefits: 'Google Cloud Educator Badge, $500 Cloud Credits for Student Lab Projects',
        status: 'Open for Enrollment'
      },
      {
        id: 'fdp-3',
        company: 'Amazon Web Services (AWS)',
        badge: 'AWS Academy Partner',
        title: 'AWS Academy Cloud Educator Certification Workshop',
        date: 'Oct 20 – 24, 2026',
        mode: 'Virtual Self-Paced + Live Q&A',
        benefits: 'Free AWS Solutions Architect Exam Voucher, Official AWS Curriculum Licensing',
        status: 'Open for Enrollment'
      },
      {
        id: 'fdp-4',
        company: 'NVIDIA Deep Learning Institute (DLI)',
        badge: 'NVIDIA DLI Certificate',
        title: 'Accelerated Computing & LLM Fine-Tuning for Computer Science Faculty',
        date: 'Nov 02 – 04, 2026',
        mode: 'Virtual GPU Workstation Access',
        benefits: 'NVIDIA DLI Teaching Kit, 50 Cloud GPU Hours for Department Lab',
        status: 'Open for Enrollment'
      }
    ]
  };

  // ---------------------------------------------------------------------------
  // 2. MATHEMATICAL MULTI-AXIS SVG RADAR CHART GENERATOR
  // ---------------------------------------------------------------------------

  function renderRadarChart(companyId) {
    const company = state.companies.find(c => c.id === companyId) || state.companies[0];
    const container = document.getElementById('radar-svg-container');
    if (!container) return;

    const size = 300;
    const center = size / 2;
    const radius = 100;
    
    const axes = [
      { key: 'prog', label: 'DSA & Prog', angle: -90 },
      { key: 'web', label: 'Web & APIs', angle: -30 },
      { key: 'db', label: 'Databases', angle: 30 },
      { key: 'cloud', label: 'DevOps / Cloud', angle: 90 },
      { key: 'system', label: 'Architecture', angle: 150 },
      { key: 'soft', label: 'Problem Solving', angle: 210 }
    ];

    function getCoords(valueRatio, angleDeg) {
      const angleRad = (angleDeg * Math.PI) / 180;
      const r = radius * valueRatio;
      return {
        x: center + r * Math.cos(angleRad),
        y: center + r * Math.sin(angleRad)
      };
    }

    let gridPolygons = '';
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(ratio => {
      const points = axes.map(a => {
        const pt = getCoords(ratio, a.angle);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      }).join(' ');
      gridPolygons += `<polygon points="${points}" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.2" />`;
    });

    let axisElements = '';
    axes.forEach(a => {
      const end = getCoords(1.0, a.angle);
      const labelPos = getCoords(1.22, a.angle);
      axisElements += `
        <line x1="${center}" y1="${center}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
        <text x="${labelPos.x.toFixed(1)}" y="${labelPos.y.toFixed(1)}" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" fill="#a1a1aa" text-anchor="middle" dominant-baseline="middle">
          ${a.label}
        </text>
      `;
    });

    const isRegistered = state.student && state.student.isRegistered;
    const studentPoints = axes.map(a => {
      const score = isRegistered ? (state.student.radarScores[a.key] || 0) : 0;
      const pt = getCoords(score / 100, a.angle);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

    const companyPoints = axes.map(a => {
      const score = company.benchmark[a.key] || 70;
      const pt = getCoords(score / 100, a.angle);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

    let studentPolygon = isRegistered
      ? `<polygon points="${studentPoints}" fill="var(--accent-subtle)" stroke="var(--primary)" stroke-width="2.5" />`
      : '';
    let studentVertices = '';
    if (isRegistered) {
      axes.forEach(a => {
        const score = state.student.radarScores[a.key] || 0;
        const pt = getCoords(score / 100, a.angle);
        studentVertices += `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4" fill="var(--primary)" stroke="#09090b" stroke-width="1.8" />`;
      });
    }

    const svg = `
      <svg class="radar-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${gridPolygons}
        ${axisElements}
        <polygon points="${companyPoints}" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4 3" />
        ${studentPolygon}
        ${studentVertices}
      </svg>
      ${!isRegistered ? `
        <div style="text-align: center; font-size: 0.76rem; color: var(--text-muted); margin-top: 6px; padding: 6px 10px; background: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border-medium);">
          Awaiting student registration. Click <strong>"Register Live Student"</strong> above to plot your live multi-axis competency polygon.
        </div>
      ` : ''}
    `;

    container.innerHTML = svg;

    const radarTitle = document.getElementById('radar-target-company');
    if (radarTitle) {
      radarTitle.textContent = company.name;
    }

    renderCategoryBars(company);
  }

  function renderCategoryBars(company) {
    const list = document.getElementById('category-bars-list');
    if (!list) return;

    const isRegistered = state.student && state.student.isRegistered;
    const s = state.student;

    const categories = [
      { name: 'DSA & Programming', student: isRegistered ? (s.radarScores.prog || 0) : 0, req: company.benchmark.prog },
      { name: 'Web & API Architecture', student: isRegistered ? (s.radarScores.web || 0) : 0, req: company.benchmark.web },
      { name: 'Databases & SQL', student: isRegistered ? (s.radarScores.db || 0) : 0, req: company.benchmark.db },
      { name: 'DevOps & Containerization', student: isRegistered ? (s.radarScores.cloud || 0) : 0, req: company.benchmark.cloud },
      { name: 'System Design', student: isRegistered ? (s.radarScores.system || 0) : 0, req: company.benchmark.system },
      { name: 'Problem Solving & Soft Skills', student: isRegistered ? (s.radarScores.soft || 0) : 0, req: company.benchmark.soft }
    ];

    list.innerHTML = categories.map(cat => {
      const isDeficit = !isRegistered || (cat.student < cat.req);
      const fillPercent = Math.min(100, Math.max(0, cat.student));
      const cutoffPercent = Math.min(100, Math.max(0, cat.req));

      return `
        <div class="cat-bar-item">
          <div class="cat-bar-labels">
            <span class="cat-name">${cat.name}</span>
            <span class="cat-values">
              <span style="color: ${!isRegistered ? 'var(--text-muted)' : (isDeficit ? '#ef4444' : '#22c55e')};">${isRegistered ? cat.student + '%' : '0%'}</span> / Req: ${cat.req}%
            </span>
          </div>
          <div class="progress-track-dual">
            <div class="bar-fill-student" style="width: ${fillPercent}%;"></div>
            <div class="bar-marker-cutoff" style="left: ${cutoffPercent}%;" title="Company Cutoff: ${cat.req}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 3. SYSTEM 1: MATCHING DIRECTORY RENDERING & FILTERING
  // ---------------------------------------------------------------------------

  function renderCompanyMatchingList() {
    const container = document.getElementById('company-list-container');
    if (!container) return;

    const filtered = state.companies.filter(c => {
      const matchesTier = state.activeFilterTier === 'all' || c.tier === state.activeFilterTier;
      const q = state.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.roleTitle.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-medium);">
          <p style="color: var(--text-muted); font-weight: 600;">No company roles matched your current filter.</p>
          <button class="pill-filter-btn" style="margin-top: 10px;" onclick="window.SkillBridge.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(c => {
      const isRegistered = state.student && state.student.isRegistered;
      const isSelected = c.id === state.selectedCompanyId;
      const tierClass = isRegistered
        ? (c.matchScore >= 85 ? 'tier-high' : (c.matchScore >= 70 ? 'tier-moderate' : 'tier-target'))
        : 'tier-target';
      const tierName = isRegistered
        ? (c.matchScore >= 85 ? 'High Match' : (c.matchScore >= 70 ? 'Strong Fit' : 'Target Goal'))
        : 'Awaiting Intake';
      const displayScore = isRegistered ? `${c.matchScore}%` : 'Pending';

      return `
        <div class="company-card ${isSelected ? 'selected' : ''}" data-company-id="${c.id}" onclick="window.SkillBridge.selectCompany('${c.id}')">
          <div class="company-card-top">
            <div class="company-identity">
              <div class="company-logo-box" style="background: ${c.brandColor};">
                ${c.brandLetter}
              </div>
              <div class="company-name-role">
                <h3>${c.name}</h3>
                <div class="role-title">${c.roleTitle}</div>
              </div>
            </div>
            
            <div class="match-score-badge">
              <div class="score-pill ${tierClass}">
                <span>${displayScore}</span>
              </div>
              <div class="tier-label">${tierName}</div>
            </div>
          </div>
          
          <div class="company-card-middle">
            <div class="explainable-reason">
              <span style="font-size: 1rem;">💡</span>
              <span><strong>Explainable AI Match:</strong> ${isRegistered ? c.explainableReason : 'Register live student in the top session bar to compute real-time WVSE-v2 vector match.'}</span>
            </div>
            
            <div class="skills-tags-row">
              ${c.matchedSkills.map(s => `<span class="skill-tag matched">✓ ${s}</span>`).join('')}
              ${c.missingSkills.map(s => `<span class="skill-tag missing">⚠ ${s}</span>`).join('')}
            </div>
          </div>
          
          <div class="company-card-bottom">
            <div>
              <span>Stipend: <strong class="offer-stipend">${c.stipend}</strong></span>
              <span style="margin: 0 8px;">•</span>
              <span>PPO: <strong>${c.ppoPackage}</strong></span>
            </div>
            
            <button class="btn-card-action" onclick="event.stopPropagation(); window.SkillBridge.openMatchBreakdown('${c.id}')">
              Inspect Formula 🔍
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 4. SYSTEM 2: EMPIRICAL SKILL GAP RESOLUTION ENGINE
  // ---------------------------------------------------------------------------

  function renderSkillGapSection() {
    const selector = document.getElementById('gap-company-selector');
    if (selector && selector.options.length === 0) {
      selector.innerHTML = state.companies.map(c => `
        <option value="${c.id}" ${c.id === state.selectedCompanyId ? 'selected' : ''}>
          ${c.name} — ${c.roleTitle}
        </option>
      `).join('');
    }

    const currentCompany = state.companies.find(c => c.id === state.selectedCompanyId) || state.companies[0];
    const tableBody = document.getElementById('gap-table-body');
    if (!tableBody) return;

    let criticalCount = 0;
    let recommendedCount = 0;
    let masteredCount = 0;

    tableBody.innerHTML = currentCompany.requiredSkillGaps.map(g => {
      const gapMagnitude = Math.max(0, g.req - g.cur);
      let severityBadge = '';
      let meterClass = 'none';

      if (g.cur >= g.req) {
        masteredCount++;
        severityBadge = '<span class="severity-badge verified">🟢 Verified Match</span>';
        meterClass = 'full';
      } else if (gapMagnitude >= 35 || (g.type === 'Core' && gapMagnitude >= 25)) {
        criticalCount++;
        severityBadge = '<span class="severity-badge critical">⚡ Critical Blocker</span>';
        meterClass = 'none';
      } else {
        recommendedCount++;
        severityBadge = '<span class="severity-badge recommended">◈ Recommended Gap</span>';
        meterClass = 'partial';
      }

      const percentFill = Math.min(100, Math.round((g.cur / g.req) * 100));
      const trustClass = g.trustTier === 'verified' ? 'verified' : (g.trustTier === 'assessed' ? 'assessed' : 'claimed');
      const trustLabel = g.trustTier === 'verified' ? '🛡️ Verified (1.0x)' : (g.trustTier === 'assessed' ? '⚡ Assessed (0.75x)' : '📝 Claimed (0.4x)');

      return `
        <tr>
          <td>
            <div class="skill-title-cell">
              <span>${g.skill}</span>
              <span class="skill-category-badge">${g.category}</span>
            </div>
          </td>
          <td>
            <span class="comp-type-pill ${g.type === 'Core' ? 'core' : 'elective'}">${g.type} ${g.weight}%</span>
          </td>
          <td><strong style="color: var(--text-main);">${g.req}%</strong></td>
          <td><span style="font-weight: 700; color: ${g.cur >= g.req ? '#22c55e' : '#ef4444'};">${g.cur}%</span></td>
          <td>
            <span class="trust-badge ${trustClass}" title="${g.evidence || ''}">
              ${trustLabel}
            </span>
          </td>
          <td class="gap-meter-cell">
            <div class="meter-track">
              <div class="meter-fill ${meterClass}" style="width: ${percentFill}%;"></div>
            </div>
            <div class="meter-label">
              <span>${percentFill}% Attained</span>
              <span style="font-weight: 700; color: ${gapMagnitude > 0 ? '#ef4444' : '#22c55e'};">${gapMagnitude > 0 ? `-${gapMagnitude}% Δ` : '0 Δ'}</span>
            </div>
          </td>
          <td>${severityBadge}</td>
          <td style="text-align: right;">
            ${g.cur >= g.req ? `
              <button class="btn-action-sm" style="background: #22c55e;" onclick="window.SkillBridge.openCertificateModal('${g.skill}')">
                ✓ Verified
              </button>
            ` : `
              <button class="btn-action-sm" onclick="window.SkillBridge.launchSkillFix('${g.skill}')">
                Bridge Skill ↗
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    const critEl = document.getElementById('stat-critical-count');
    const recEl = document.getElementById('stat-rec-count');
    const mastEl = document.getElementById('stat-mastered-count');
    if (critEl) critEl.textContent = criticalCount;
    if (recEl) recEl.textContent = recommendedCount;
    if (mastEl) mastEl.textContent = masteredCount;
  }

  // ---------------------------------------------------------------------------
  // 5. SYSTEM 3: SKILL DEVELOPMENT SYSTEM (Roadmaps, Labs, Tests, Certificates)
  // ---------------------------------------------------------------------------

  function renderRoadmaps() {
    const container = document.getElementById('roadmaps-container');
    if (!container) return;

    container.innerHTML = `
      <div class="roadmap-card">
        <div class="roadmap-header">
          <div class="roadmap-author-badge">
            <div class="company-avatar-sm" style="background: #2563eb;">TN</div>
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 700;">TechNova Full Stack & Microservices Roadmap (2026 Batch)</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">Curated by TechNova Senior Cloud Engineering Team • 4 Milestone Phases</p>
            </div>
          </div>
          <span class="severity-badge verified">Official Partner Roadmap</span>
        </div>

        <div class="timeline-stepper">
          <div class="timeline-node completed">
            <div class="node-number">✓</div>
            <div class="node-title">Phase 1: Foundations</div>
            <div class="node-desc">Advanced TypeScript, React 19 State Machines, REST API contracts. Completed & Verified.</div>
          </div>
          
          <div class="timeline-node completed">
            <div class="node-number">✓</div>
            <div class="node-title">Phase 2: Data & Backend</div>
            <div class="node-desc">PostgreSQL connection pooling, indexing, ACID transactions. Completed & Verified.</div>
          </div>
          
          <div class="timeline-node" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.12);">
            <div class="node-number" style="background: #ef4444; color: #fff; border-color: #ef4444;">3</div>
            <div class="node-title" style="color: #f87171;">Phase 3: Docker & Microservices</div>
            <div class="node-desc"><strong>Active Skill Gap:</strong> Containerizing Node/React services, Docker Compose multi-containers.</div>
            <button class="btn-action-sm" style="margin-top: 10px;" onclick="window.SkillBridge.launchQuizTest('docker')">Take Test to Pass Phase 3</button>
          </div>
          
          <div class="timeline-node">
            <div class="node-number">4</div>
            <div class="node-title">Phase 4: Kubernetes & K8s</div>
            <div class="node-desc">Pods, Services, Helm charts, Ingress routing and production cluster health monitors.</div>
          </div>
        </div>
      </div>

      <div class="roadmap-card">
        <div class="roadmap-header">
          <div class="roadmap-author-badge">
            <div class="company-avatar-sm" style="background: #0ea5e9;">DC</div>
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 700;">DataCore Vector Systems & Semantic Search Track</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">Curated by DataCore AI Research Division • Closing Batch Deficits</p>
            </div>
          </div>
          <span class="severity-badge recommended">AI/ML Pathway</span>
        </div>

        <div class="timeline-stepper">
          <div class="timeline-node completed">
            <div class="node-number">✓</div>
            <div class="node-title">Phase 1: Python & Linear Algebra</div>
            <div class="node-desc">NumPy vectorized operations, Pandas transformations, embedding math.</div>
          </div>
          <div class="timeline-node">
            <div class="node-number">2</div>
            <div class="node-title">Phase 2: Vector Embeddings</div>
            <div class="node-desc">Generating text embeddings with transformers, Pinecone index optimization.</div>
          </div>
          <div class="timeline-node">
            <div class="node-number">3</div>
            <div class="node-title">Phase 3: RAG Architecture</div>
            <div class="node-desc">Hybrid retrieval, re-ranking models, context window chunking strategies.</div>
          </div>
          <div class="timeline-node">
            <div class="node-number">4</div>
            <div class="node-title">Phase 4: Capstone AI API</div>
            <div class="node-desc">Production deployment with FastAPI, latency benchmark, and evaluation harness.</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderLabs() {
    const container = document.getElementById('labs-container');
    if (!container) return;

    container.innerHTML = `
      <div class="lab-card">
        <div>
          <div class="lab-badge-row">
            <span class="severity-badge critical">Closing Critical Gap</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">2-Day Bootcamp</span>
          </div>
          <div class="lab-title">Docker & Microservices Hands-on Virtual Sandbox</div>
          <div class="lab-meta">Arranged by College T&P Cell in collaboration with TechNova Solutions. Provides direct cloud CLI sandbox.</div>
        </div>
        <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.launchVirtualSandbox('Docker & Microservices')">
          Launch Virtual Lab Sandbox ⚡
        </button>
      </div>

      <div class="lab-card">
        <div>
          <div class="lab-badge-row">
            <span class="severity-badge verified">Industry Endorsed</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Self-Paced Sandbox</span>
          </div>
          <div class="lab-title">AWS Solutions Architect Cloud Lab</div>
          <div class="lab-meta">Pre-configured Amazon EC2, VPC, and S3 environment for student practice with guided tasks.</div>
        </div>
        <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.launchVirtualSandbox('AWS Cloud Sandbox')">
          Launch Virtual Lab Sandbox ⚡
        </button>
      </div>

      <div class="lab-card">
        <div>
          <div class="lab-badge-row">
            <span class="severity-badge recommended">College Elective</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Scheduled Workshop</span>
          </div>
          <div class="lab-title">Vector DBs & RAG Architecture Workshop</div>
          <div class="lab-meta">Interactive hands-on session hosted by DataCore AI engineers on Saturday, 10:00 AM.</div>
        </div>
        <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.showToast('Enrolled in DataCore RAG Workshop! Calendar invite sent.', 'success')">
          Enroll in Workshop ↗
        </button>
      </div>
    `;
  }

  function renderMentors() {
    const container = document.getElementById('mentors-container');
    if (!container) return;

    container.innerHTML = `
      <div class="mentor-card">
        <div class="mentor-avatar">AR</div>
        <h4>Ananya Roy</h4>
        <div class="mentor-role">Staff Cloud Architect @ TechNova Solutions</div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">Specializes in container migration, Kubernetes orchestration, and technical interview preparation.</p>
        <button class="btn-card-action" style="width: 100%;" onclick="window.SkillBridge.bookMentor('Ananya Roy')">Book 1:1 Skill Review Session</button>
      </div>

      <div class="mentor-card">
        <div class="mentor-avatar" style="background: linear-gradient(135deg, #0ea5e9, #0284c7);">VS</div>
        <h4>Venkatesh S.</h4>
        <div class="mentor-role">Principal Systems Engineer @ Zoho Corp</div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">Focuses on core algorithms, high-throughput database systems, and product engineering mindsets.</p>
        <button class="btn-card-action" style="width: 100%;" onclick="window.SkillBridge.bookMentor('Venkatesh S.')">Book 1:1 Skill Review Session</button>
      </div>

      <div class="mentor-card">
        <div class="mentor-avatar" style="background: linear-gradient(135deg, #22c55e, #16a34a);">PM</div>
        <h4>Priyanka Menon</h4>
        <div class="mentor-role">Senior Machine Learning Scientist @ TCS Research</div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">Guides students on applied research, paper publications, and AI corporate problem solving.</p>
        <button class="btn-card-action" style="width: 100%;" onclick="window.SkillBridge.bookMentor('Priyanka Menon')">Book 1:1 Skill Review Session</button>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // 6. COMPANY PERSPECTIVE (Recruiter Candidate Matching View)
  // ---------------------------------------------------------------------------

  function renderRecruiterPortal() {
    const company = state.companies.find(c => c.id === state.selectedRecruiterCompanyId) || state.companies[0];
    const tableBody = document.getElementById('recruiter-candidates-tbody');
    if (!tableBody) return;

    const recNameEl = document.getElementById('recruiter-company-name');
    if (recNameEl) recNameEl.textContent = company.name;

    if (state.recruiterCandidates.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 48px 24px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">🏢</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Candidate Talent Pool is Empty</div>
            <div style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 16px;">All previous student data has been wiped. Register live students using the Student Intake Portal to calibrate and populate candidates for corporate recruiting.</div>
            <button class="action-btn-neon" onclick="window.SkillBridge.switchPerspective('student'); window.SkillBridge.openRegisterModal();" style="padding: 8px 20px; font-size: 0.85rem;">
              <span>✨</span> Register Live Student
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = state.recruiterCandidates.map(cand => {
      const readiness = cand.id === 'c1' ? state.student.overallReadiness : cand.readiness;
      const matchScore = cand.id === 'c1' ? company.matchScore : cand.radarMatch;
      const isShortlisted = cand.status.includes('Shortlisted');

      return `
        <tr>
          <td>
            <div class="candidate-cell">
              <div class="avatar" style="width: 38px; height: 38px; font-size: 0.85rem;">
                ${cand.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <strong style="color: var(--text-main);">${cand.name}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${cand.roll} • ${cand.gpa}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="score-pill ${cand.tierClass}" style="font-size: 0.88rem; padding: 2px 10px;">
              ${matchScore}% Match
            </span>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${cand.tier}</div>
          </td>
          <td>
            <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main);">${cand.keyStrengths}</div>
            <div style="font-size: 0.7rem; color: #f87171;">Deficit: ${cand.gapAlert}</div>
          </td>
          <td>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${cand.badges.map(b => `<span class="skill-tag matched" style="font-size: 0.68rem;">★ ${b}</span>`).join('')}
            </div>
          </td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 600; color: ${isShortlisted ? '#22c55e' : '#2563eb'};">
              ${cand.status}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-action-sm" onclick="window.SkillBridge.shortlistCandidate('${cand.name}', '${company.name}')">
              ${isShortlisted ? 'Offer Sent ✓' : 'Shortlist Candidate ↗'}
            </button>
            <button class="btn-card-action" style="padding: 6px 12px; font-size: 0.72rem; margin-left: 6px;" onclick="window.SkillBridge.openRecruiterFeedbackModal('${cand.id}')">
              Telemetry 📝
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 7. COMPREHENSIVE FACULTY & ACADEMIA PORTAL ENGINE
  // ---------------------------------------------------------------------------

  // 7A. Student Progress & Profile Monitoring
  function renderFacultyStudents() {
    const tbody = document.getElementById('faculty-students-tbody');
    if (!tbody) return;

    if (state.facultyStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px 24px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">🎓</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No Live Student Records in Academic Cohort</div>
            <div style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 16px;">Clean slate initialized. Register a live student in the Student Portal to populate this faculty cohort table with real-time academic and placement telemetry.</div>
            <button class="action-btn-neon" onclick="window.SkillBridge.switchPerspective('student'); window.SkillBridge.openRegisterModal();" style="padding: 8px 20px; font-size: 0.85rem;">
              <span>✨</span> Launch Student Intake
            </button>
          </td>
        </tr>
      `;
      return;
    }

    const filtered = state.facultyStudents.filter(s => {
      const matchesFilter = state.facultyStudentFilter === 'all' || s.status === state.facultyStudentFilter;
      const q = state.facultyStudentSearch.toLowerCase().trim();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q) || s.buildingNow.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
            No students found matching current filter or search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const isYou = s.id === 'f-s1';
      const currentReadiness = isYou ? state.student.overallReadiness : s.readiness;
      const badgesCount = isYou ? state.student.verifiedBadgesCount : s.verifiedBadges.length;

      return `
        <tr>
          <td>
            <div class="candidate-cell">
              <div class="avatar" style="width: 38px; height: 38px; font-size: 0.85rem; background: ${isYou ? 'linear-gradient(135deg, #0f172a, #2563eb)' : '#64748b'};">
                ${s.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <strong style="color: var(--text-main);">${s.name} ${isYou ? '<span style="color: #38bdf8; font-size: 0.75rem;">(Active Demo)</span>' : ''}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${s.roll} • ${s.branch}</div>
              </div>
            </div>
          </td>
          <td><strong>${s.cgpa}</strong></td>
          <td>
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: ${currentReadiness >= 85 ? '#22c55e' : (currentReadiness >= 70 ? '#2563eb' : '#ef4444')};">
                ${currentReadiness}%
              </span>
              <span style="font-size: 0.7rem; color: #22c55e; font-weight: 600;">${s.trend}</span>
            </div>
          </td>
          <td>
            <span class="skill-building-tag">
              <span class="skill-building-dot"></span>
              <span>${s.buildingNow}</span>
            </span>
          </td>
          <td>
            <span class="severity-badge verified" style="font-size: 0.7rem;">
              ★ ${badgesCount} Verified
            </span>
          </td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 600; color: ${s.status === 'ready' ? '#22c55e' : (s.status === 'bridging' ? '#2563eb' : '#ef4444')};">
              ${s.statusLabel}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn-action-sm" onclick="window.SkillBridge.inspectStudentProfile('${s.id}')">
              Inspect Profile ↗
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function inspectStudentProfile(studentId) {
    const student = state.facultyStudents.find(s => s.id === studentId) || state.facultyStudents[0];
    const modal = document.getElementById('student-profile-modal');
    if (!modal) return;

    const isYou = student.id === 'f-s1';
    const readiness = isYou ? state.student.overallReadiness : student.readiness;
    const badges = isYou 
      ? ['React.js Certified', 'PostgreSQL Specialist', 'DSA Gold', 'Git & CI/CD', 'Docker Verified']
      : student.verifiedBadges;

    document.getElementById('modal-student-name').textContent = student.name;
    document.getElementById('modal-student-roll').textContent = `${student.roll} • ${student.branch} • CGPA: ${student.cgpa}`;
    document.getElementById('modal-student-readiness').textContent = `${readiness}%`;
    document.getElementById('modal-student-building').textContent = student.buildingNow;
    document.getElementById('modal-student-target').textContent = student.targetCompany;

    const badgesContainer = document.getElementById('modal-student-badges');
    if (badgesContainer) {
      badgesContainer.innerHTML = badges.map(b => `<span class="skill-tag matched" style="font-size: 0.75rem;">★ ${b}</span>`).join(' ');
    }

    modal.classList.add('active');
  }

  function closeStudentProfileModal() {
    const modal = document.getElementById('student-profile-modal');
    if (modal) modal.classList.remove('active');
  }

  // 7B. Emerging Market Tech Intelligence
  function renderMarketTechTrends() {
    const container = document.getElementById('market-tech-container');
    if (!container) return;

    container.innerHTML = state.marketTechTrends.map(t => `
      <div class="market-tech-card">
        <div>
          <div class="tech-card-header">
            <div class="tech-icon-box" style="background: ${t.iconBg};">
              ${t.icon}
            </div>
            <span class="surge-badge">${t.surge}</span>
          </div>

          <h3 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
            ${t.title}
          </h3>
          <div style="font-size: 0.75rem; color: var(--primary-bright, #38bdf8); font-weight: 600; margin-bottom: 12px;">
            🏢 Demand: ${t.recruiterCount}
          </div>

          <div style="background: var(--bg-subtle); border: 1px solid var(--border-light); border-radius: 8px; padding: 10px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">College Syllabus Coverage:</span>
              <span class="syllabus-status-tag ${t.syllabusStatusClass}">${t.syllabusStatus}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.35;">${t.syllabusNote}</p>
          </div>
        </div>

        <div>
          <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.openSyllabusProposalModal('${t.title}', '${t.recommendedCourse}')">
            Propose to Dean of Academics ↗
          </button>
        </div>
      </div>
    `).join('');
  }

  // 7C. Syllabus Revisions Submitted to Dean
  function renderSyllabusProposals() {
    const tbody = document.getElementById('proposals-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = state.syllabusProposals.map(p => `
      <tr>
        <td>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: #2563eb;">
            ${p.id}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${p.date}</div>
        </td>
        <td>
          <strong style="color: var(--text-main); font-size: 0.85rem;">${p.title}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Proposed to: <strong style="color: var(--text-main);">${p.targetDean}</strong> by ${p.proposedBy}</div>
        </td>
        <td>
          <span style="font-size: 0.75rem; color: #f87171; font-weight: 600;">${p.deficitStat}</span>
        </td>
        <td>
          <span class="proposal-status-badge ${p.statusClass}">
            ${p.statusClass === 'approved' ? '✓' : '⏳'} ${p.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  function openSyllabusProposalModal(techTitle, courseRecommendation) {
    const modal = document.getElementById('syllabus-proposal-modal');
    if (!modal) return;

    document.getElementById('proposal-tech-name').value = techTitle || 'Docker Multi-stage Builds & Kubernetes';
    document.getElementById('proposal-target-course').value = courseRecommendation || 'CSE-402: Cloud Deployment Lab';
    document.getElementById('proposal-rationale').value = '44 Recruiting companies have marked this competency as a mandatory hiring cutoff for Batch 2026. Current student deficit is 68%. Adding this elective/lab module eliminates this gap before placement drives commence.';

    modal.classList.add('active');
  }

  function closeSyllabusProposalModal() {
    const modal = document.getElementById('syllabus-proposal-modal');
    if (modal) modal.classList.remove('active');
  }

  function submitProposalToDean() {
    const title = document.getElementById('proposal-tech-name').value;
    const course = document.getElementById('proposal-target-course').value;
    const rationale = document.getElementById('proposal-rationale').value;

    const newId = 'BOS-REV-2026-0' + Math.floor(85 + Math.random() * 15);
    const newDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    state.syllabusProposals.unshift({
      id: newId,
      title: `Curriculum Revision: ${title} in ${course}`,
      proposedBy: 'Prof. R. Sharma (CSE Faculty Admin)',
      targetDean: 'Dr. S. K. Mukherjee (Dean of Academics)',
      date: newDate,
      deficitStat: 'Active Batch Deficit Reported via SkillBridge Portal',
      rationale: rationale,
      status: 'Under Review by Dean Dr. S. K. Mukherjee',
      statusClass: 'review'
    });

    closeSyllabusProposalModal();
    renderSyllabusProposals();

    showToast(`Official Proposal ${newId} dispatched to Dean Dr. S. K. Mukherjee & Board of Studies!`, 'success');
  }

  // 7D. Industry Collaboration (Sabbaticals, Challenges, Joint R&D)
  function renderFacultyCollaboration() {
    const sabContainer = document.getElementById('collab-sabbaticals-container');
    const chalContainer = document.getElementById('collab-challenges-container');
    const rndContainer = document.getElementById('collab-rnd-container');

    if (sabContainer) {
      sabContainer.innerHTML = state.facultyCollaboration.sabbaticals.map(s => `
        <div class="collab-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="severity-badge verified">${s.company}</span>
              <span class="grant-pill">${s.stipend}</span>
            </div>
            <h4 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
              ${s.title}
            </h4>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
              <strong>Duration:</strong> ${s.duration} • <strong>Location:</strong> ${s.location}
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">${s.focus}</p>
          </div>
          <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.applyForSabbatical('${s.title}')">
            Apply for Faculty Sabbatical ↗
          </button>
        </div>
      `).join('');
    }

    if (chalContainer) {
      chalContainer.innerHTML = state.facultyCollaboration.consultingChallenges.map(c => `
        <div class="collab-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="severity-badge recommended">${c.code} • ${c.company}</span>
              <span class="grant-pill">${c.grant}</span>
            </div>
            <h4 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
              ${c.title}
            </h4>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
              <strong>Timeline:</strong> ${c.timeline}
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">${c.description}</p>
          </div>
          <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.applyForConsulting('${c.title}')">
            Submit Consulting Proposal ↗
          </button>
        </div>
      `).join('');
    }

    if (rndContainer) {
      rndContainer.innerHTML = state.facultyCollaboration.jointResearch.map(r => `
        <div style="background: var(--bg-card); border: 1.5px solid var(--border-light); border-radius: 12px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <h4 style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${r.professor}</h4>
            <span class="severity-badge verified">Active Grant</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-main); font-weight: 600; margin-bottom: 6px;">${r.project}</div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 8px;">
            <span>Grant: <strong style="color: #22c55e;">${r.budget}</strong></span>
            <span>Duration: <strong>${r.duration}</strong></span>
          </div>
          <div style="font-size: 0.72rem; color: var(--primary-bright, #38bdf8); margin-top: 6px;">🎯 Deliverable: ${r.deliverable}</div>
        </div>
      `).join('');
    }
  }

  // 7E. Corporate Faculty Development Programs (FDPs)
  function renderFacultyFDPs() {
    const container = document.getElementById('fdps-container');
    if (!container) return;

    container.innerHTML = state.facultyFDPs.map(f => `
      <div class="fdp-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="severity-badge verified">${f.company}</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 9999px;">${f.badge}</span>
          </div>

          <h3 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
            ${f.title}
          </h3>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">
            <strong>Dates:</strong> ${f.date} • <strong>Mode:</strong> ${f.mode}
          </div>
          <div style="background: var(--bg-subtle); border: 1px solid var(--border-light); border-radius: 8px; padding: 10px; margin: 12px 0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Faculty Benefits:</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${f.benefits}</div>
          </div>
        </div>

        <button class="btn-action-sm" style="width: 100%; justify-content: center;" onclick="window.SkillBridge.enrollInFDP('${f.id}', '${f.title}')">
          ${f.status.includes('Enrolled') ? 'Enrolled ✓ (Calendar Synced)' : 'Enroll in FDP Workshop ↗'}
        </button>
      </div>
    `).join('');
  }

  // ---------------------------------------------------------------------------
  // 8. INTERACTIVE QUIZ & TEST LOGIC (Real-time score boost & certificate)
  // ---------------------------------------------------------------------------

  function startQuizModal() {
    const modal = document.getElementById('quiz-modal');
    if (modal) modal.classList.add('active');
  }

  function closeQuizModal() {
    const modal = document.getElementById('quiz-modal');
    if (modal) modal.classList.remove('active');
  }

  async function submitQuiz() {
    closeQuizModal();

    let certHash = null;
    let apiSuccess = false;

    // Connect to Node.js Backend API if reachable
    if (ApiClient.isConnected) {
      try {
        showToast('Transmitting proctored assessment telemetry to Node.js Backend...', 'info');
        
        // 1. Submit adaptive quiz answers to backend
        const assessmentRes = await ApiClient.submitAssessment('cloud_docker', [1, 2, 1, 0]);
        
        // 2. Request cryptographic certificate verification & seal
        const certRes = await ApiClient.verifyCertificate({
          title: 'Docker Certified Associate (DCA)',
          issuer: 'Docker Inc. / Linux Foundation',
          issue_date: '2026-09-15',
          skill_code: 'cloud_docker'
        });

        if (certRes && certRes.certificate && certRes.certificate.verification_hash) {
          certHash = certRes.certificate.verification_hash;
          apiSuccess = true;
        }
      } catch (err) {
        console.warn('Backend quiz submit error:', err);
      }
    }

    state.student.radarScores.cloud = 76;
    state.student.radarScores.web = 89;
    state.student.overallReadiness = 86;
    state.student.verifiedBadgesCount += 1;
    state.student.criticalGapsCount = Math.max(0, state.student.criticalGapsCount - 1);
    
    // Update TechNova's match score from 84% to 94%!
    const tn = state.companies.find(c => c.id === 'technova');
    if (tn) {
      tn.matchScore = 94;
      tn.tier = 'high';
      tn.explainableReason = 'Exceptional verified competency in Docker, React & Node.js (+78%). Cryptographic proof issued; direct interview eligible!';
      tn.matchedSkills.push('Docker Containerization (Verified)');
      tn.missingSkills = tn.missingSkills.filter(s => !s.includes('Docker'));
      
      const dockerGap = tn.requiredSkillGaps.find(g => g.skill.includes('Docker'));
      if (dockerGap) {
        dockerGap.cur = 85;
        dockerGap.severity = 'verified';
        dockerGap.trustTier = 'verified';
        dockerGap.trustMultiplier = 1.0;
        dockerGap.evidence = 'Verified via TechNova Proctored Validation Test (Cryptographic Hash)';
      }
    }

    // Update Faculty student record for Hariprasad PS
    const fHariprasad = state.facultyStudents.find(s => s.id === 'f-s1');
    if (fHariprasad) {
      fHariprasad.readiness = 86;
      fHariprasad.status = 'ready';
      fHariprasad.statusLabel = 'Placement Ready (>85%)';
      fHariprasad.buildingNow = 'Advanced Kubernetes & Chaos Mesh';
      fHariprasad.verifiedBadges.push('Docker Containerization Verified');
    }

    updateExecutiveMetrics();
    renderRadarChart(state.selectedCompanyId);
    renderCompanyMatchingList();
    renderSkillGapSection();
    renderRecruiterPortal();
    renderFacultyStudents();

    openCertificateModal('Docker Containerization & Microservices', certHash);
    const successMsg = apiSuccess
      ? '🎉 Assessment scored 100% on Backend! Cryptographic SHA-256 seal issued & stored in PostgreSQL.'
      : 'Congratulations! You passed the TechNova Validation Quiz with 100% score! Overall readiness boosted to 86%.';
    showToast(successMsg, 'success');
  }

  function updateExecutiveMetrics() {
    const readEl = document.getElementById('metric-readiness');
    const badgeEl = document.getElementById('metric-badges');
    const gapEl = document.getElementById('metric-critical-gaps');
    const highMatchEl = document.getElementById('metric-high-matches');

    const s = state.student;
    const isRegistered = s && s.isRegistered;

    if (readEl) readEl.textContent = isRegistered ? `${s.overallReadiness}%` : '0%';
    if (badgeEl) badgeEl.textContent = isRegistered ? s.verifiedBadgesCount : 0;
    if (gapEl) gapEl.textContent = isRegistered ? s.criticalGapsCount : 0;
    if (highMatchEl) {
      const count = isRegistered ? state.companies.filter(c => c.matchScore >= 85).length : 0;
      highMatchEl.textContent = count;
    }
  }

  function openCertificateModal(skillName, customHash) {
    const modal = document.getElementById('cert-modal');
    if (!modal) return;
    
    const titleEl = document.getElementById('cert-skill-title');
    const hashEl = document.getElementById('cert-crypto-hash');
    const dateEl = document.getElementById('cert-issue-date');

    if (titleEl) titleEl.textContent = skillName || 'Docker Containerization & Microservices';
    if (hashEl) hashEl.textContent = customHash ? `HASH: ${customHash}` : ('HASH: 0x9F' + Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase());
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    modal.classList.add('active');
  }

  function closeCertificateModal() {
    const modal = document.getElementById('cert-modal');
    if (modal) modal.classList.remove('active');
  }

  // ---------------------------------------------------------------------------
  // 8B. EXPLAINABLE AI MATCHING FORMULA BREAKDOWN (WVSE-v2 Model)
  // ---------------------------------------------------------------------------

  function openMatchBreakdown(companyId) {
    const company = state.companies.find(c => c.id === companyId) || state.companies[0];
    const modal = document.getElementById('match-breakdown-modal');
    if (!modal) return;

    const titleEl = document.getElementById('breakdown-company-title');
    const scoreEl = document.getElementById('breakdown-total-score');
    const tbody = document.getElementById('breakdown-table-body');
    const explainEl = document.getElementById('breakdown-explain-text');

    if (titleEl) titleEl.textContent = `${company.name} — ${company.roleTitle}`;
    if (scoreEl) {
      scoreEl.textContent = `${company.matchScore}% Composite Match`;
      const tierClass = company.matchScore >= 85 ? 'tier-high' : (company.matchScore >= 70 ? 'tier-moderate' : 'tier-target');
      scoreEl.className = `score-pill ${tierClass}`;
    }

    if (tbody) {
      tbody.innerHTML = company.requiredSkillGaps.map(g => {
        const attainment = Math.min(1.0, g.cur / g.req);
        const mult = g.trustMultiplier || 1.0;
        const contrib = (g.weight * attainment * mult);
        const trustLabel = g.trustTier === 'verified' ? '🛡️ Tier 3 (1.00x)' : (g.trustTier === 'assessed' ? '⚡ Tier 2 (0.75x)' : '📝 Tier 1 (0.40x)');
        const trustClass = g.trustTier === 'verified' ? 'verified' : (g.trustTier === 'assessed' ? 'assessed' : 'claimed');

        return `
          <tr>
            <td>
              <strong>${g.skill}</strong>
              <div style="font-size: 0.68rem; color: var(--text-muted);">${g.evidence || 'Evidence Pending'}</div>
            </td>
            <td><span class="comp-type-pill ${g.type === 'Core' ? 'core' : 'elective'}">${g.type}</span></td>
            <td><strong>${g.weight}%</strong></td>
            <td>${g.req}%</td>
            <td><span style="color: ${g.cur >= g.req ? '#22c55e' : '#ef4444'}; font-weight: 700;">${g.cur}%</span></td>
            <td><span class="trust-badge ${trustClass}">${trustLabel}</span></td>
            <td style="text-align: right;"><strong style="color: var(--primary-bright, #38bdf8);">+${contrib.toFixed(1)}%</strong></td>
          </tr>
        `;
      }).join('');
    }

    if (explainEl) {
      explainEl.innerHTML = `
        <strong>Algorithmic Justification (WVSE-v2 Model):</strong> 
        Calculated across <strong>${company.requiredSkillGaps.length} weighted competency vectors</strong> (${company.requiredSkillGaps.filter(g => g.type === 'Core').length} Core Mandatory + ${company.requiredSkillGaps.filter(g => g.type === 'Elective').length} Elective). 
        ${company.explainableReason}
      `;
    }

    modal.classList.add('active');
  }

  function closeMatchBreakdownModal() {
    const modal = document.getElementById('match-breakdown-modal');
    if (modal) modal.classList.remove('active');
  }

  // ---------------------------------------------------------------------------
  // 8C. RECRUITER POST-INTERVIEW TELEMETRY & CLOSED-LOOP FEEDBACK
  // ---------------------------------------------------------------------------

  let activeFeedbackCandId = 'c1';

  function openRecruiterFeedbackModal(candId) {
    activeFeedbackCandId = candId || 'c1';
    const cand = state.recruiterCandidates.find(c => c.id === candId) || state.recruiterCandidates[0];
    const modal = document.getElementById('recruiter-feedback-modal');
    if (!modal) return;

    const candNameInput = document.getElementById('feedback-candidate-name');
    if (candNameInput) candNameInput.value = `${cand.name} (${cand.roll})`;

    modal.classList.add('active');
  }

  function closeRecruiterFeedbackModal() {
    const modal = document.getElementById('recruiter-feedback-modal');
    if (modal) modal.classList.remove('active');
  }

  async function submitRecruiterFeedback() {
    const outcome = document.getElementById('feedback-outcome')?.value;
    const deficits = document.getElementById('feedback-deficits')?.value || 'Observed container volume persistence challenges during sandbox interview.';
    const cand = state.recruiterCandidates.find(c => c.id === activeFeedbackCandId);

    if (cand) {
      if (outcome === 'offer') {
        cand.status = 'Offer Extended (PPO Approved)';
      } else if (outcome === 'shortlist') {
        cand.status = 'Passed Round 1 Screening';
      } else {
        cand.status = 'Deficit Flagged (Curriculum Bridging)';
      }
      renderRecruiterPortal();
    }

    // Connect to Node.js Backend Telemetry API
    if (ApiClient.isConnected) {
      try {
        await ApiClient.recordTelemetry({
          student_id: cand ? cand.id : 'f-s1',
          company_id: state.selectedRecruiterCompanyId || 'c-technova',
          role_title: 'Full Stack Cloud Engineer',
          technical_score: outcome === 'offer' ? 95 : (outcome === 'shortlist' ? 84 : 65),
          practical_problem_score: outcome === 'offer' ? 92 : 75,
          feedback_notes: deficits,
          hire_verdict: outcome
        });

        await ApiClient.submitProposal({
          course_code: 'CSE-402',
          title: 'Curriculum Revision: Docker Container Volume Persistence & Compose Debugging',
          department: 'Computer Science & Engineering',
          proposed_modules: ['Docker Volume Management', 'Multi-Container Compose Debugging'],
          deficit_justification: deficits
        });
      } catch (err) {
        console.warn('Backend telemetry error:', err);
      }
    }

    // Closed loop: Inject empirical deficit into faculty proposals registry
    state.syllabusProposals.unshift({
      id: `BOS-REV-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Curriculum Revision: Docker Container Volume Persistence & Compose Debugging',
      proposedBy: 'Industry Recruiter Telemetry (TechNova Solutions)',
      targetDean: 'Dr. S. K. Mukherjee (Dean of Academics)',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      deficitStat: 'Direct Interview Deficit Reported by Recruiter',
      rationale: `Direct post-interview telemetry from corporate hiring partner: "${deficits}"`,
      status: 'Under Review by Dean Dr. S. K. Mukherjee',
      statusClass: 'review'
    });

    renderSyllabusProposals();
    closeRecruiterFeedbackModal();
    showToast('Recruiter interview telemetry dispatched to Backend! College Board of Studies and Dean Dr. S. K. Mukherjee notified of empirical deficit.', 'success');
  }

  // ---------------------------------------------------------------------------
  // 9. TOAST NOTIFICATIONS & SIMULATORS
  // ---------------------------------------------------------------------------

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function notifyCollegeCurriculum() {
    showToast('Official Alert logged with Department of CSE Board of Studies & T&P Cell! Syllabus revision queue updated.', 'success');
    
    // Add to proposals
    openSyllabusProposalModal('Docker Containerization & Kubernetes (Batch Alert)', 'CSE-402 Cloud Deployment Lab');
  }

  // ---------------------------------------------------------------------------
  // "PURPLE" LIGHT MODE ADMIN DASHBOARD CHARTS (Dual-Series Bar Chart & SVG Donut)
  // ---------------------------------------------------------------------------

  function renderPurpleAdminCharts() {
    // 1. Dual-Series Bar Chart (Target vs Actual Placement Velocity)
    const barContainer = document.getElementById('purple-bar-chart-container');
    if (barContainer) {
      const data = [
        { month: 'Jan', target: 55, actual: 48 },
        { month: 'Feb', target: 65, actual: 62 },
        { month: 'Mar', target: 70, actual: 76 },
        { month: 'Apr', target: 80, actual: 85 },
        { month: 'May', target: 82, actual: 90 },
        { month: 'Jun', target: 88, actual: 94 },
        { month: 'Jul', target: 95, actual: 92 }
      ];

      barContainer.innerHTML = data.map(d => `
        <div class="purple-bar-group">
          <div class="purple-bars-pair">
            <div class="purple-bar primary" style="height: ${Math.round(d.actual * 1.6)}px;" title="${d.month} Actual Attainment: ${d.actual}%"></div>
            <div class="purple-bar secondary" style="height: ${Math.round(d.target * 1.6)}px;" title="${d.month} Target Benchmark: ${d.target}%"></div>
          </div>
          <span class="purple-bar-label">${d.month}</span>
        </div>
      `).join('');
    }

    // 2. Colorful Donut Chart SVG (Domain Mastery Allocation)
    const donutBox = document.getElementById('purple-donut-svg-box');
    if (donutBox) {
      const radius = 64;
      const circ = 2 * Math.PI * radius; // ~402.12
      // Slices: FullStack (42%), DevOps (28%), AI/ML (18%), Cyber (12%)
      const s1 = 0.42 * circ;
      const s2 = 0.28 * circ;
      const s3 = 0.18 * circ;
      const s4 = 0.12 * circ;

      donutBox.innerHTML = `
        <svg viewBox="0 0 160 160" width="180" height="180" style="transform: rotate(-90deg);">
          <!-- Background Track -->
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="22" />
          <!-- Slice 1: FullStack (#A05AFF - 42%) -->
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#A05AFF" stroke-width="22"
            stroke-dasharray="${s1} ${circ - s1}" stroke-dashoffset="0" stroke-linecap="round" />
          <!-- Slice 2: DevOps (#1BCFB4 - 28%) -->
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#1BCFB4" stroke-width="22"
            stroke-dasharray="${s2} ${circ - s2}" stroke-dashoffset="-${s1}" stroke-linecap="round" />
          <!-- Slice 3: AI/Data (#FF7675 - 18%) -->
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#FF7675" stroke-width="22"
            stroke-dasharray="${s3} ${circ - s3}" stroke-dashoffset="-${s1 + s2}" stroke-linecap="round" />
          <!-- Slice 4: Cloud/Security (#38B6FF - 12%) -->
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#38B6FF" stroke-width="22"
            stroke-dasharray="${s4} ${circ - s4}" stroke-dashoffset="-${s1 + s2 + s3}" stroke-linecap="round" />
        </svg>
      `;
    }
  }

  // ---------------------------------------------------------------------------
  // 10. GLOBAL CONTROLLER INTERFACE (SkillBridge Object)
  // ---------------------------------------------------------------------------

  window.SkillBridge = {
    // Optional Theme Mode Controller (Obsidian Dark vs Purple Light)
    switchTheme: function (theme) {
      const activeTheme = (theme === 'purple-light') ? 'purple-light' : 'dark';
      if (activeTheme === 'purple-light') {
        document.documentElement.setAttribute('data-theme', 'purple-light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try {
        localStorage.setItem('skillbridge_theme', activeTheme);
      } catch (e) {}

      document.querySelectorAll('.theme-pill').forEach(btn => {
        const choice = btn.getAttribute('data-theme-choice');
        btn.classList.toggle('active', choice === activeTheme);
      });

      // Update favicon and touch icons based on theme
      const currentIcon = (activeTheme === 'purple-light') ? 'logo-light.jpg' : 'logo-dark.jpg';
      const faviconLink = document.querySelector('link[rel="icon"]');
      if (faviconLink) {
        faviconLink.href = currentIcon;
      }
      const touchIconLink = document.querySelector('link[rel="apple-touch-icon"]');
      if (touchIconLink) {
        touchIconLink.href = currentIcon;
      }

      const label = (activeTheme === 'purple-light') 
        ? '☀️ "Purple" Light Mode (#F4F5F7 & Spacious White)' 
        : '🌙 Obsidian Dark Mode (#09090B)';
      showToast(`Interface Theme: ${label}`, 'info');

      if (state && state.selectedCompanyId) {
        renderRadarChart(state.selectedCompanyId);
      }
      renderPurpleAdminCharts();
    },

    initTheme: function () {
      let saved = 'dark';
      try {
        saved = localStorage.getItem('skillbridge_theme') || 'dark';
      } catch (e) {}
      if (saved === 'purple-light') {
        document.documentElement.setAttribute('data-theme', 'purple-light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      const initialIcon = (saved === 'purple-light') ? 'logo-light.jpg' : 'logo-dark.jpg';
      const faviconLink = document.querySelector('link[rel="icon"]');
      if (faviconLink) {
        faviconLink.href = initialIcon;
      }
      const touchIconLink = document.querySelector('link[rel="apple-touch-icon"]');
      if (touchIconLink) {
        touchIconLink.href = initialIcon;
      }

      document.querySelectorAll('.theme-pill').forEach(btn => {
        const choice = btn.getAttribute('data-theme-choice');
        btn.classList.toggle('active', choice === saved);
      });
    },

    // Ultra-Modern Obsidian Neon Accent Controller (Mint, Violet, Cyan)
    switchAccent: function (accent) {
      let activeAccent = 'mint';
      if (accent === 'violet' || accent === 'purple') {
        activeAccent = 'violet';
      } else if (accent === 'cyan' || accent === 'blue') {
        activeAccent = 'cyan';
      } else {
        activeAccent = 'mint';
      }
      document.documentElement.setAttribute('data-accent', activeAccent);
      try {
        localStorage.setItem('skillbridge_accent', activeAccent);
      } catch (e) {}

      document.querySelectorAll('.accent-pill').forEach(btn => {
        const choice = btn.getAttribute('data-accent-choice');
        btn.classList.toggle('active', choice === activeAccent);
      });

      const label = (activeAccent === 'mint') ? '⚡ Cyber Neon Mint (#00F5A0)' : 
                    (activeAccent === 'violet') ? '🔮 Ultra Electric Violet (#8B5CF6)' : 
                    '💎 Hyper Cyan (#00E5FF)';
      showToast(`Accent palette active: ${label}`, 'info');

      if (state && state.selectedCompanyId) {
        renderRadarChart(state.selectedCompanyId);
      }
    },

    initAccent: function () {
      let saved = 'mint';
      try {
        saved = localStorage.getItem('skillbridge_accent') || 'mint';
      } catch (e) {}
      let activeAccent = 'mint';
      if (saved === 'violet' || saved === 'purple') {
        activeAccent = 'violet';
      } else if (saved === 'cyan' || saved === 'blue') {
        activeAccent = 'cyan';
      } else {
        activeAccent = 'mint';
      }
      document.documentElement.setAttribute('data-accent', activeAccent);
      document.querySelectorAll('.accent-pill').forEach(btn => {
        const choice = btn.getAttribute('data-accent-choice');
        btn.classList.toggle('active', choice === activeAccent);
      });
    },

    // Perspective switcher
    switchPerspective: function (perspective) {
      state.activePerspective = perspective;
      
      document.querySelectorAll('.perspective-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.perspective === perspective);
      });

      document.querySelectorAll('.portal-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `portal-${perspective}`);
      });

      if (perspective === 'student') {
        renderRadarChart(state.selectedCompanyId);
      } else if (perspective === 'company') {
        renderRecruiterPortal();
      } else if (perspective === 'faculty') {
        renderFacultyStudents();
        renderMarketTechTrends();
        renderSyllabusProposals();
        renderFacultyCollaboration();
        renderFacultyFDPs();
      } else if (perspective === 'admin') {
        renderPurpleAdminCharts();
      }

      showToast(`Switched view to ${perspective.toUpperCase()} Portal.`, 'info');
    },

    renderPurpleAdminCharts: renderPurpleAdminCharts,

    // Student System Tab Switcher
    switchSystemTab: function (tab) {
      state.activeSystemTab = tab;
      
      document.querySelectorAll('.system-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });

      document.querySelectorAll('.system-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `sec-${tab}`);
      });

      if (tab === 'matching') {
        renderRadarChart(state.selectedCompanyId);
      } else if (tab === 'gap-fixing') {
        renderSkillGapSection();
      } else if (tab === 'development') {
        renderRoadmaps();
        renderLabs();
        renderMentors();
      }
    },

    // Development Subtab Switcher
    switchDevSubtab: function (subtab) {
      state.activeDevSubtab = subtab;
      
      document.querySelectorAll('.dev-subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
      });

      document.querySelectorAll('.dev-subpanel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `dev-subpanel-${subtab}`);
      });
    },

    // Faculty Subtab Switcher
    switchFacultySubtab: function (subtab) {
      state.facultySubtab = subtab;

      document.querySelectorAll('.faculty-subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.facultytab === subtab);
      });

      document.querySelectorAll('.faculty-subpanel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `faculty-subpanel-${subtab}`);
      });

      if (subtab === 'students') renderFacultyStudents();
      if (subtab === 'market-tech') renderMarketTechTrends();
      if (subtab === 'curriculum-gap') renderSyllabusProposals();
      if (subtab === 'collaboration') renderFacultyCollaboration();
      if (subtab === 'fdps') renderFacultyFDPs();
    },

    setFacultyStudentFilter: function (filter) {
      state.facultyStudentFilter = filter;
      document.querySelectorAll('.faculty-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      renderFacultyStudents();
    },

    inspectStudentProfile: function (studentId) {
      inspectStudentProfile(studentId);
    },

    closeStudentProfile: function () {
      closeStudentProfileModal();
    },

    openSyllabusProposalModal: function (techTitle, courseRec) {
      openSyllabusProposalModal(techTitle, courseRec);
    },

    closeSyllabusProposalModal: function () {
      closeSyllabusProposalModal();
    },

    submitProposalToDean: function () {
      submitProposalToDean();
    },

    applyForSabbatical: function (title) {
      showToast(`Sabbatical application for "${title}" submitted to Academic HR & Corporate Host!`, 'success');
    },

    applyForConsulting: function (title) {
      showToast(`Consulting expression of interest submitted for "${title}". Corporate sponsor notified.`, 'success');
    },

    enrollInFDP: function (fdpId, title) {
      const fdp = state.facultyFDPs.find(f => f.id === fdpId);
      if (fdp) {
        fdp.status = 'Enrolled ✓';
      }
      renderFacultyFDPs();
      showToast(`Enrolled in "${title}"! Google Calendar invitation and virtual lab credentials sent to faculty email.`, 'success');
    },

    // Matching interactions
    selectCompany: function (companyId) {
      state.selectedCompanyId = companyId;
      renderCompanyMatchingList();
      renderRadarChart(companyId);
      renderSkillGapSection();
    },

    setFilterTier: function (tier) {
      state.activeFilterTier = tier;
      document.querySelectorAll('.pill-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tier === tier);
      });
      renderCompanyMatchingList();
    },

    resetFilters: function () {
      state.activeFilterTier = 'all';
      state.searchQuery = '';
      const input = document.getElementById('search-company-input');
      if (input) input.value = '';
      this.setFilterTier('all');
    },

    changeGapCompany: function (companyId) {
      state.selectedCompanyId = companyId;
      renderRadarChart(companyId);
      renderSkillGapSection();
      renderCompanyMatchingList();
    },

    changeRecruiterCompany: function (companyId) {
      state.selectedRecruiterCompanyId = companyId;
      renderRecruiterPortal();
    },

    launchSkillFix: function (skillName) {
      this.switchSystemTab('development');
      this.switchDevSubtab('roadmaps');
      showToast(`Navigated to roadmaps and labs for "${skillName}".`, 'info');
    },

    launchQuizTest: function (topic) {
      startQuizModal();
    },

    closeQuiz: function () {
      closeQuizModal();
    },

    submitQuizAnswers: function () {
      submitQuiz();
    },

    openCertificateModal: function (skillName) {
      openCertificateModal(skillName);
    },

    closeCertificateModal: function () {
      closeCertificateModal();
    },

    launchVirtualSandbox: function (labName) {
      showToast(`Provisioning secure cloud container for "${labName}"... Terminal live in 3 seconds!`, 'info');
      setTimeout(() => {
        showToast(`Virtual Lab Sandbox "${labName}" is active! Connect via port 8080.`, 'success');
      }, 2000);
    },

    bookMentor: function (mentorName) {
      showToast(`1:1 Mentorship request dispatched to ${mentorName}. Check your registered college email for Google Meet invitation!`, 'success');
    },

    shortlistCandidate: function (candName, compName) {
      showToast(`Candidate ${candName} shortlisted for Technical Interview Round 1 at ${compName}!`, 'success');
      const cand = state.recruiterCandidates.find(c => c.name.includes(candName.split(' ')[0]));
      if (cand) {
        cand.status = `Shortlisted by ${compName}`;
        renderRecruiterPortal();
      }
    },

    notifyAcademia: function () {
      notifyCollegeCurriculum();
    },

    openMatchDetails: function (companyId) {
      this.selectCompany(companyId);
      const company = state.companies.find(c => c.id === companyId);
      if (company) {
        showToast(`Loaded ${company.name} algorithmic analysis into graphical radar chart.`, 'info');
      }
    },

    openMatchBreakdown: function (companyId) {
      openMatchBreakdown(companyId);
    },

    closeMatchBreakdownModal: function () {
      closeMatchBreakdownModal();
    },

    openRecruiterFeedbackModal: function (candId) {
      openRecruiterFeedbackModal(candId);
    },

    closeRecruiterFeedbackModal: function () {
      closeRecruiterFeedbackModal();
    },

    submitRecruiterFeedback: function () {
      submitRecruiterFeedback();
    },

    syncWithBackend: function () {
      return syncWithBackend();
    },

    openRegisterModal: function () {
      openRegisterModal();
    },

    closeRegisterModal: function () {
      closeRegisterModal();
    },

    openLoginModal: function () {
      openLoginModal();
    },

    closeLoginModal: function () {
      closeLoginModal();
    },

    openCredentialsModal: function (creds) {
      openCredentialsModal(creds);
    },

    closeCredentialsModal: function () {
      closeCredentialsModal();
    },

    copyCredentials: function () {
      copyCredentials();
    },

    launchLiveTrackingFromModal: function () {
      launchLiveTrackingFromModal();
    },

    submitStudentRegistration: function () {
      submitStudentRegistration();
    },

    submitStudentLogin: function () {
      submitStudentLogin();
    },

    resetStudentDataPrompt: function () {
      resetStudentDataPrompt();
    },

    handleUserChipClick: function () {
      handleUserChipClick();
    },

    applyLiveStudentData: function (student, creds, saveLocal) {
      applyLiveStudentData(student, creds, saveLocal);
    },

    recalculateCompanyMatches: function (student) {
      recalculateCompanyMatches(student);
    },

    api: ApiClient
  };

  // ---------------------------------------------------------------------------
  // 11. INITIALIZATION ON DOM READY
  // ---------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    // Check if a live student session exists in localStorage
    const savedStudent = localStorage.getItem('skillbridge_auth_student');
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        if (parsed.student && parsed.student.isRegistered) {
          applyLiveStudentData(parsed.student, parsed.credentials, false);
        } else {
          updateLiveStudentSessionUI();
        }
      } catch (e) {
        updateLiveStudentSessionUI();
      }
    } else {
      updateLiveStudentSessionUI();
    }

    updateExecutiveMetrics();
    renderCompanyMatchingList();
    renderRadarChart(state.selectedCompanyId);
    renderSkillGapSection();
    renderRoadmaps();
    renderLabs();
    renderMentors();
    renderRecruiterPortal();
    renderFacultyStudents();
    renderMarketTechTrends();
    renderSyllabusProposals();
    renderFacultyCollaboration();
    renderFacultyFDPs();
    window.SkillBridge.initAccent();
    window.SkillBridge.initTheme();
    renderPurpleAdminCharts();

    // Auto-connect and synchronize with live Node.js / Express / PostgreSQL backend
    syncWithBackend();

    const searchInput = document.getElementById('search-company-input');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        state.searchQuery = e.target.value;
        renderCompanyMatchingList();
      });
    }

    const facSearch = document.getElementById('faculty-search-students');
    if (facSearch) {
      facSearch.addEventListener('input', function (e) {
        state.facultyStudentSearch = e.target.value;
        renderFacultyStudents();
      });
    }

    const gapDropdown = document.getElementById('gap-company-selector');
    if (gapDropdown) {
      gapDropdown.addEventListener('change', function (e) {
        window.SkillBridge.changeGapCompany(e.target.value);
      });
    }

    const recDropdown = document.getElementById('recruiter-company-selector');
    if (recDropdown) {
      recDropdown.addEventListener('change', function (e) {
        window.SkillBridge.changeRecruiterCompany(e.target.value);
      });
    }
  });

})();