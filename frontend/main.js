
// DOM elements
let loginPage, dashboardPage;
let loginForm, logoutBtn;
let loginError;
let userNameEl, userEmailEl, userAvatar;

// Session Helpers
function setUserSession(admin) {
  localStorage.setItem("activeAdmin", JSON.stringify(admin));
}

function getUserSession() {
  try {
    return JSON.parse(localStorage.getItem("activeAdmin"));
  } catch {
    return null;
  }
}

function clearUserSession() {
  localStorage.removeItem("activeAdmin");
}

// UI Handlers
function showPage(page) {
  if (!loginPage || !dashboardPage) return;
  loginPage.classList.add("hidden");
  dashboardPage.classList.add("hidden");
  page.classList.remove("hidden");
}

async function renderDashboard(admin) {
  if (!userNameEl || !userEmailEl || !userAvatar) return;

  const displayName = admin.email;

  userNameEl.textContent = displayName;
  userEmailEl.textContent = admin.email;
  userAvatar.textContent = displayName.charAt(0).toUpperCase();

  showPage(dashboardPage);

  // Initialize with events section active by default
  navigateToSection('events-section');

  // Auto-refresh events petr minute
  setInterval(() => {
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'events-section') {
      loadEventSchedule();
    }
  }, 60000);
}

async function loadEventSchedule() {
  const eventList = document.getElementById("event-list");
  if (!eventList) return;

  try {
    eventList.innerHTML = `
      <div class="event-card">
        <div class="event-header">Loading events...</div>
        <div class="event-body">Fetching latest event schedule</div>
      </div>
    `;

    const data = await apiGetEvents();
    const now = new Date();

    if (data.schedule && data.schedule.length > 0) {
      eventList.innerHTML = data.schedule.map(event => {
        const start = event.start_time ? new Date(event.start_time) : null;
        const end = event.end_time ? new Date(event.end_time) : null;

        let statusText = event.status || "Scheduled";
        let highlightClass = "";

        if (start && end) {
          if (now >= start && now <= end) {
            statusText = "Ongoing";
            highlightClass = "highlight";
          } else if (now < start) {
            statusText = "Upcoming";
          } else if (now > end) {
            statusText = "Completed";
          }
        }

        return `
          <div class="event-card ${highlightClass}">
            <div class="event-header">${event.name || "Untitled Event"}</div>
            <div class="event-body">
              <p><strong>Start:</strong> ${start ? start.toLocaleString() : "TBD"}</p>
              <p><strong>End:</strong> ${end ? end.toLocaleString() : "TBD"}</p>
            </div>
            <div class="event-footer">Status: ${statusText}</div>
          </div>
        `;
      }).join('');
    } else {
      eventList.innerHTML = `
        <div class="event-card">
          <div class="event-header">No Events Scheduled</div>
          <div class="event-body">No events found in the database</div>
          <div class="event-footer">Last updated: ${now.toLocaleTimeString()}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading events:', error);
    eventList.innerHTML = `
      <div class="event-card">
        <div class="event-header">Error Loading Events</div>
        <div class="event-body">Failed to fetch event schedule. Please try refreshing.</div>
        <div class="event-footer">Error: ${error.message || "Unknown error"}</div>
      </div>
    `;
  }
}

async function loadUsers() {
  const usersList = document.getElementById("users-list");
  if (!usersList) return;

  try {
    usersList.innerHTML = `
      <div class="user-item">
        <div class="user-info">
          <div class="user-email">Loading users...</div>
          <div class="user-role">Fetching user data</div>
        </div>
      </div>
    `;

    const data = await apiGetUsers();

    if (data.success && data.users && data.users.length > 0) {
      // Filter to show only users with role 'user' (not admins)
      const regularUsers = data.users.filter(user => user.role === 'user');
      
      if (regularUsers.length === 0) {
        usersList.innerHTML = `
          <div class="user-item">
            <div class="user-info">
              <div class="user-email">No regular users found</div>
              <div class="user-role">Only admin users exist in the database</div>
            </div>
          </div>
        `;
        return;
      }

      usersList.innerHTML = regularUsers.map(user => {
        const status = user.userstatus?.is_banned ? 'banned' : 'active';
        const statusText = status === 'banned' ? 'Banned' : 'Active';
        const banDate = user.userstatus?.banned_at ? new Date(user.userstatus.banned_at).toLocaleString() : '';
        const reason = user.userstatus?.reason || '';

        return `
          <div class="user-item" data-user-id="${user.id}">
            <div class="user-info">
              <div class="user-email">${user.email}</div>
              <div class="user-role ${user.role}">${user.role}</div>
              <div class="user-status ${status}">
                Status: ${statusText}
                ${status === 'banned' && banDate ? `<br><small>Banned: ${banDate}</small>` : ''}
                ${status === 'banned' && reason ? `<br><small>Reason: ${reason}</small>` : ''}
              </div>
            </div>
            <div class="user-actions">
              ${status === 'active' ? 
                `<button class="btn-ban" onclick="banUser(${user.id}, '${user.email}')">Ban User</button>` :
                `<button class="btn-unban" onclick="unbanUser(${user.id}, '${user.email}')">Unban User</button>`
              }
            </div>
          </div>
        `;
      }).join('');
    } else {
      usersList.innerHTML = `
        <div class="user-item">
          <div class="user-info">
            <div class="user-email">No users found</div>
            <div class="user-role">No user data available</div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading users:', error);
    usersList.innerHTML = `
      <div class="user-item">
        <div class="user-info">
          <div class="user-email">Error Loading Users</div>
          <div class="user-role">Failed to fetch user data. Please try refreshing.</div>
          <div class="user-status">Error: ${error.message || "Unknown error"}</div>
        </div>
      </div>
    `;
  }
}

async function loadSubmissions() {
  const submissionsList = document.getElementById("submissions-list");
  if (!submissionsList) return;

  try {
    submissionsList.innerHTML = `
      <div class="submission-item">
        <div class="submission-info">
          <div class="submission-title">Loading submissions...</div>
          <div class="submission-desc">Fetching submission data</div>
        </div>
      </div>
    `;

    // Load submissions and filters
    const [submissionsData, filtersData] = await Promise.all([
      apiGetSubmissions(),
      apiGetSubmissionFilters()
    ]);

    // Update filter dropdowns
    updateSubmissionFilters(filtersData.filters);

    if (submissionsData.success && submissionsData.submissions && submissionsData.submissions.length > 0) {
      renderSubmissions(submissionsData.submissions);
      return;
    }
    
    // show placeholder content
    //temp
    submissionsList.innerHTML = `
      <div class="submission-item">
        <div class="submission-info">
          <div class="submission-title">Hackathon Submissions</div>
          <div class="submission-desc">Ready for database integration with hackportal</div>
          <div class="submission-status pending">Database integration pending</div>
        </div>
        <div class="submission-actions">
          <button class="btn-view" disabled>View</button>
          <button class="btn-edit" disabled>Edit</button>
        </div>
      </div>
      <div class="submission-item">
        <div class="submission-info">
          <div class="submission-title">Task Management System</div>
          <div class="submission-desc">Will display user submissions once connected to hackportal database</div>
          <div class="submission-status review">Ready for integration</div>
        </div>
        <div class="submission-actions">
          <button class="btn-approve" disabled>Approve</button>
          <button class="btn-reject" disabled>Reject</button>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading submissions:', error);
    submissionsList.innerHTML = `
      <div class="submission-item">
        <div class="submission-info">
          <div class="submission-title">Error Loading Submissions</div>
          <div class="submission-desc">Failed to fetch submission data. Please try refreshing.</div>
          <div class="submission-status rejected">Error: ${error.message || "Unknown error"}</div>
        </div>
      </div>
    `;
  }
}

function updateSubmissionFilters(filters) {
  const teamFilter = document.getElementById("team-filter");
  const typeFilter = document.getElementById("type-filter");

  if (teamFilter && filters.teams) {
    teamFilter.innerHTML = '<option value="">All Teams</option>' + 
      filters.teams.map(team => `<option value="${team}">${team}</option>`).join('');
  }

  if (typeFilter && filters.types) {
    typeFilter.innerHTML = '<option value="">All Types</option>' + 
      filters.types.map(type => `<option value="${type}">${type}</option>`).join('');
  }
}

function renderSubmissions(submissions) {
  const submissionsList = document.getElementById("submissions-list");
  
  submissionsList.innerHTML = submissions.map(submission => {
    const submittedDate = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Unknown';
    const submissionType = submission.type || 'Unknown';
    
    return `
      <div class="submission-item" data-submission-id="${submission.id}">
        <div class="submission-header">
          <div>
            <div class="submission-title">${submission.title || 'Untitled Submission'}</div>
            <div class="submission-team">Team: ${submission.teamId || 'N/A'}</div>
            <div class="submission-meta">
              <span>Type: ${submissionType}</span>
              <span>Submitted: ${submittedDate}</span>
              <span>By: ${submission.submittedBy || 'Unknown'}</span>
            </div>
          </div>
          <div class="submission-status ${submissionType.toLowerCase()}">${submissionType}</div>
        </div>
        
        <div class="submission-body">
          <div class="submission-description">${submission.description || 'No description provided'}</div>
          
          <div class="submission-links">
            <div class="submission-link ${submission.pptLink ? '' : 'empty'}">
              <span>📊 PPT:</span>
              ${submission.pptLink ? 
                `<a href="${submission.pptLink}" target="_blank">${submission.pptLink}</a>` : 
                '<span>Not provided</span>'
              }
            </div>
            <div class="submission-link ${submission.githubLink ? '' : 'empty'}">
              <span>💻 GitHub:</span>
              ${submission.githubLink ? 
                `<a href="${submission.githubLink}" target="_blank">${submission.githubLink}</a>` : 
                '<span>Not provided</span>'
              }
            </div>
            <div class="submission-link ${submission.finalPptLink ? '' : 'empty'}">
              <span>📋 Final PPT:</span>
              ${submission.finalPptLink ? 
                `<a href="${submission.finalPptLink}" target="_blank">${submission.finalPptLink}</a>` : 
                '<span>Not provided</span>'
              }
            </div>
            <div class="submission-link ${submission.figmaLink ? '' : 'empty'}">
              <span>🎨 Figma:</span>
              ${submission.figmaLink ? 
                `<a href="${submission.figmaLink}" target="_blank">${submission.figmaLink}</a>` : 
                '<span>Not provided</span>'
              }
            </div>
          </div>
        </div>
        
        <div class="submission-actions">
          <button class="btn-view" onclick="viewSubmission(${submission.id})">View Details</button>
          <button class="btn-edit" onclick="editSubmission(${submission.id})">Edit</button>
          <button class="btn-download" onclick="downloadSubmission(${submission.id})">Download</button>
        </div>
      </div>
    `;
  }).join('');
}

// API Calls
async function apiLogin(email, password) {
  console.log('Frontend: Attempting login for:', email);
  const res = await fetch("http://localhost:4000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await res.json();
  console.log('Frontend: Server response:', res.status, data);
  
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  
  return data;
}

async function apiGetEvents() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("http://localhost:4000/events", {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Events API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

async function apiGetUsers() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("http://localhost:4000/users", {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Users API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

async function apiBanUser(userId, reason = '') {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("http://localhost:4000/users/ban", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ user_id: userId, reason })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Ban user API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

async function apiUnbanUser(userId) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("http://localhost:4000/users/unban", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ user_id: userId })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Unban user API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

async function apiGetSubmissions() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("http://localhost:4000/submissions", {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Get submissions API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

async function apiGetSubmissionFilters() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("http://localhost:4000/submissions/filters", {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Get submission filters API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

async function apiUpdateSubmission(submissionId, updateData) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`http://localhost:4000/submissions/${submissionId}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Update submission API error:', errorData);
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  
  return res.json();
}

// ==========================
// Navigation and User Actions
// ==========================
function navigateToSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Update navigation
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.classList.remove('active'));
  
  const activeNavLink = document.querySelector(`[onclick="navigateToSection('${sectionId}')"]`);
  if (activeNavLink) {
    activeNavLink.classList.add('active');
  }

  // Load data based on section
  if (sectionId === 'events-section') {
    loadEventSchedule();
  } else if (sectionId === 'users-section') {
    loadUsers();
  } else if (sectionId === 'submissions-section') {
    loadSubmissions();
  } else if (sectionId === 'scoring-section') {
    // Initialize scoring section - default to entry tab
    switchScoringTab('entry');
  }
}

async function banUser(userId, userEmail) {
  if (!confirm(`Are you sure you want to ban user: ${userEmail}?`)) {
    return;
  }

  const reason = prompt(`Please provide a reason for banning ${userEmail}:`, '');
  if (reason === null) { // User cancelled
    return;
  }

  try {
    const result = await apiBanUser(userId, reason.trim() || 'No reason provided');
    
    if (result.success) {
      alert(`User ${userEmail} has been banned successfully`);
      loadUsers(); // Refresh the users list
    } else {
      alert(`Failed to ban user: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error banning user:', error);
    alert(`Error banning user: ${error.message || 'Unknown error'}`);
  }
}

async function unbanUser(userId, userEmail) {
  if (!confirm(`Are you sure you want to unban user: ${userEmail}?`)) {
    return;
  }

  try {
    const result = await apiUnbanUser(userId);
    
    if (result.success) {
      alert(`User ${userEmail} has been unbanned successfully`);
      loadUsers(); // Refresh the users list
    } else {
      alert(`Failed to unban user: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error unbanning user:', error);
    alert(`Error unbanning user: ${error.message || 'Unknown error'}`);
  }
}

function viewSubmission(submissionId) {
  // Find the submission data
  const submissionElement = document.querySelector(`[data-submission-id="${submissionId}"]`);
  if (!submissionElement) return;
  
  const title = submissionElement.querySelector('.submission-title').textContent;
  alert(`Viewing submission: ${title}\n\nDetailed view modal will be implemented when needed.`);
}

function editSubmission(submissionId) {
  // Find the submission data
  const submissionElement = document.querySelector(`[data-submission-id="${submissionId}"]`);
  if (!submissionElement) return;
  
  const title = submissionElement.querySelector('.submission-title').textContent;
  
  // Simple edit functionality for now
  const newTitle = prompt('Edit submission title:', title);
  if (newTitle && newTitle !== title) {
    updateSubmissionData(submissionId, { title: newTitle });
  }
}

function downloadSubmission(submissionId) {
  const submissionElement = document.querySelector(`[data-submission-id="${submissionId}"]`);
  if (!submissionElement) return;
  
  const title = submissionElement.querySelector('.submission-title').textContent;
  alert(`Download functionality for "${title}" will be implemented when file storage is connected.`);
}

async function updateSubmissionData(submissionId, updateData) {
  try {
    const result = await apiUpdateSubmission(submissionId, updateData);
    
    if (result.success) {
      alert('Submission updated successfully');
      loadSubmissions(); // Refresh the submissions list
    } else {
      alert(`Failed to update submission: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error updating submission:', error);
    alert(`Error updating submission: ${error.message || 'Unknown error'}`);
  }
}
// Event Listeners
function setupEventListeners() {
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginError.classList.add("hidden");

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        const data = await apiLogin(email, password);

        if (!data.accessToken) {
          // Handle both authentication and authorization errors
          console.error('Login failed:', data);
          loginError.textContent = data.message || data.error || "Invalid credentials";
          loginError.classList.remove("hidden");
          return;
        }

        localStorage.setItem("accessToken", data.accessToken);
        setUserSession({ email: data.user.email });
        await renderDashboard({ email: data.user.email });
      } catch (err) {
        loginError.textContent = "Network error - server may be down";
        loginError.classList.remove("hidden");
        console.error("Login network error:", err);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearUserSession();
      localStorage.removeItem("accessToken");
      showPage(loginPage);
    });
  }

  const showSignupLink = document.getElementById("show-signup");
  if (showSignupLink) showSignupLink.addEventListener("click", () => showPage(signupPage));

  const showLoginLink = document.getElementById("show-login");
  if (showLoginLink) showLoginLink.addEventListener("click", () => showPage(loginPage));

  const refreshEventsBtn = document.getElementById("refresh-events");
  if (refreshEventsBtn) refreshEventsBtn.addEventListener("click", () => loadEventSchedule());

  const refreshUsersBtn = document.getElementById("refresh-users");
  if (refreshUsersBtn) refreshUsersBtn.addEventListener("click", () => loadUsers());

  const refreshSubmissionsBtn = document.getElementById("refresh-submissions");
  if (refreshSubmissionsBtn) refreshSubmissionsBtn.addEventListener("click", () => loadSubmissions());
}

// ==========================
// INIT
// ==========================
window.addEventListener("DOMContentLoaded", () => {
  loginPage = document.getElementById("login-page");
  signupPage = document.getElementById("signup-page");
  dashboardPage = document.getElementById("dashboard-page");

  loginForm = document.getElementById("login-form");
  signupForm = document.getElementById("signup-form");
  logoutBtn = document.getElementById("logout-btn");

  loginError = document.getElementById("login-error");
  signupError = document.getElementById("signup-error");

  userNameEl = document.getElementById("user-name");
  userEmailEl = document.getElementById("user-email");
  userAvatar = document.getElementById("user-avatar");

  setupEventListeners();

  const session = getUserSession();
  if (session) {
    renderDashboard(session);
  } else {
    showPage(loginPage);
  }
});

// SCORING SYSTEM

// Tab switching for scoring section
function switchScoringTab(tabName) {
  const entryTab = document.getElementById('score-entry-tab');
  const overviewTab = document.getElementById('score-overview-tab');
  const entryContent = document.getElementById('score-entry-content');
  const overviewContent = document.getElementById('score-overview-content');

  // Remove active class from all tabs and content
  entryTab.classList.remove('active');
  overviewTab.classList.remove('active');
  entryContent.classList.remove('active');
  overviewContent.classList.remove('active');

  // Add active class to selected tab and content
  if (tabName === 'entry') {
    entryTab.classList.add('active');
    entryContent.classList.add('active');
  } else if (tabName === 'overview') {
    overviewTab.classList.add('active');
    overviewContent.classList.add('active');
    loadScores(); // Load scores when switching to overview
  }
}

// Handle scoring form submission
async function handleScoreSubmission(event) {
  event.preventDefault();
  
  const teamId = document.getElementById('team-id-input').value.trim();
  const reviewNumber = parseInt(document.getElementById('review-number-select').value);
  const points = parseFloat(document.getElementById('points-input').value);

  if (!teamId || !reviewNumber || points === null || isNaN(points)) {
    alert('Please fill in all fields correctly');
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || getUserSession()?.accessToken;
    
    const response = await fetch('http://localhost:4000/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        team_id: teamId,
        review_number: reviewNumber,
        points: points
      })
    });

    const result = await response.json();

    if (result.success) {
      alert(`Score ${result.score.id ? 'updated' : 'added'} successfully!`);
      document.getElementById('scoring-form').reset();
      
      // Refresh scores if overview tab is active
      const overviewContent = document.getElementById('score-overview-content');
      if (overviewContent.classList.contains('active')) {
        loadScores();
      }
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    alert('Failed to submit score. Please try again.');
  }
}

// Load and display scores
async function loadScores() {
  try {
    const token = localStorage.getItem('adminToken') || getUserSession()?.accessToken;
    
    const response = await fetch('http://localhost:4000/scores', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      displayScores(result.scores);
    } else {
      console.error('Error loading scores:', result.message);
    }
  } catch (error) {
    console.error('Error loading scores:', error);
  }
}

// Display scores in the overview tab
function displayScores(scores) {
  const scoresList = document.getElementById('scores-list');
  
  if (!scores || scores.length === 0) {
    scoresList.innerHTML = '<div class="no-data">No scores found</div>';
    return;
  }

  // Group scores by team
  const scoresByTeam = {};
  scores.forEach(score => {
    if (!scoresByTeam[score.team_id]) {
      scoresByTeam[score.team_id] = [];
    }
    scoresByTeam[score.team_id].push(score);
  });

  let html = '';
  Object.keys(scoresByTeam).forEach(teamId => {
    const teamScores = scoresByTeam[teamId];
    const totalScore = teamScores[0]?.total_score || 0;
    
    html += `
      <div class="score-team-card">
        <div class="score-team-header">
          <h4>Team: ${teamId}</h4>
          <div class="total-score">Total: ${totalScore}</div>
        </div>
        <div class="score-reviews">
    `;
    
    // Display scores for each review
    for (let i = 1; i <= 3; i++) {
      const reviewScore = teamScores.find(s => s.review_number === i);
      html += `
        <div class="review-score ${reviewScore ? 'has-score' : 'no-score'}">
          <span class="review-label">Review ${i}:</span>
          <span class="points">${reviewScore ? reviewScore.points : 'Not scored'}</span>
          ${reviewScore ? `<button class="delete-score-btn" onclick="deleteScore('${reviewScore.id}')">×</button>` : ''}
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  });

  scoresList.innerHTML = html;
}

// Delete a score
async function deleteScore(scoreId) {
  if (!confirm('Are you sure you want to delete this score?')) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || getUserSession()?.accessToken;
    
    const response = await fetch(`http://localhost:4000/scores/${scoreId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      alert('Score deleted successfully!');
      loadScores(); // Refresh the scores list
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error deleting score:', error);
    alert('Failed to delete score. Please try again.');
  }
}

// Show leaderboard
async function showLeaderboard() {
  try {
    const token = localStorage.getItem('adminToken') || getUserSession()?.accessToken;
    
    const response = await fetch('http://localhost:4000/scores/leaderboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      displayLeaderboard(result.leaderboard);
      document.getElementById('leaderboard-modal').classList.remove('hidden');
    } else {
      alert(`Error loading leaderboard: ${result.message}`);
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    alert('Failed to load leaderboard. Please try again.');
  }
}

// Display leaderboard in modal
function displayLeaderboard(leaderboard) {
  const content = document.getElementById('leaderboard-content');
  
  if (!leaderboard || leaderboard.length === 0) {
    content.innerHTML = '<div class="no-data">No scores available for leaderboard</div>';
    return;
  }

  let html = '<div class="leaderboard-list">';
  leaderboard.forEach((team, index) => {
    html += `
      <div class="leaderboard-item ${index < 3 ? 'top-3' : ''}">
        <div class="rank">${index + 1}</div>
        <div class="team-info">
          <div class="team-id">${team.team_id}</div>
        </div>
        <div class="total-score">${team.total_score} pts</div>
      </div>
    `;
  });
  html += '</div>';

  content.innerHTML = html;
}

// Close leaderboard modal
function closeLeaderboard() {
  document.getElementById('leaderboard-modal').classList.add('hidden');
}

// Set up scoring event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Scoring form submission
  const scoringForm = document.getElementById('scoring-form');
  if (scoringForm) {
    scoringForm.addEventListener('submit', handleScoreSubmission);
  }

  // Refresh scores button
  const refreshScoresBtn = document.getElementById('refresh-scores');
  if (refreshScoresBtn) {
    refreshScoresBtn.addEventListener('click', loadScores);
  }

  // View leaderboard button
  const viewLeaderboardBtn = document.getElementById('view-leaderboard');
  if (viewLeaderboardBtn) {
    viewLeaderboardBtn.addEventListener('click', showLeaderboard);
  }

  // Search functionality for scores
  const searchScores = document.getElementById('search-scores');
  if (searchScores) {
    searchScores.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const scoreCards = document.querySelectorAll('.score-team-card');
      
      scoreCards.forEach(card => {
        const teamId = card.querySelector('h4').textContent.toLowerCase();
        if (teamId.includes(searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Review filter for scores
  const reviewFilter = document.getElementById('review-filter');
  if (reviewFilter) {
    reviewFilter.addEventListener('change', function() {
      // This would need more complex filtering logic
      // For now, just reload scores
      loadScores();
    });
  }
});
