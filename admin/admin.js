// ==========================================================================
// BLUEPEAK CMS ADMIN SCRIPTS
// ==========================================================================

const API_BASE = '/api';
let token = localStorage.getItem('admin_token');

// Global Data Store
let projects = [];
let services = [];
let testimonials = [];
let quotes = [];
let settings = {};
let announcements = [];
let blogPosts = [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  if (token) {
    verifyToken();
  } else {
    showLogin();
  }
});

// Event Listeners Configuration
function setupEventListeners() {
  // Login Form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Sidebar Menu Tab Swapper
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Settings Save Form
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);

  // Project Save Form
  document.getElementById('projectForm').addEventListener('submit', saveProject);

  // Service Save Form
  document.getElementById('serviceForm').addEventListener('submit', saveService);

  // Testimonial Save Form
  document.getElementById('testimonialForm').addEventListener('submit', saveTestimonial);

  // Announcement Save Form
  document.getElementById('announcementForm').addEventListener('submit', saveAnnouncement);

  // Blog Save Form
  document.getElementById('blogForm').addEventListener('submit', saveBlog);

  // Media Upload Form
  document.getElementById('mediaUploadForm').addEventListener('submit', uploadMediaFile);

  // Password Change Button & Form
  document.getElementById('changePassBtn').addEventListener('click', () => openModal('changePassModal'));
  document.getElementById('changePasswordForm').addEventListener('submit', changePassword);
}

// Token Verification
async function verifyToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('currentUser').textContent = user.username;
      showDashboard();
    } else {
      handleLogout();
    }
  } catch (err) {
    handleLogout();
  }
}

// Show/Hide Containers
function showLogin() {
  document.getElementById('loginContainer').classList.remove('hidden');
  document.getElementById('dashboardContainer').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('loginContainer').classList.add('hidden');
  document.getElementById('dashboardContainer').classList.remove('hidden');
  loadAllData();
}

// Login Action
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('loginError');
  loginError.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem('admin_token', token);
      document.getElementById('currentUser').textContent = data.username;
      showDashboard();
    } else {
      loginError.textContent = data.message || 'Login failed. Please try again.';
    }
  } catch (err) {
    loginError.textContent = 'Network error. Make sure server is running.';
  }
}

// Logout Action
function handleLogout() {
  token = null;
  localStorage.removeItem('admin_token');
  showLogin();
}

// Password Change Action
async function changePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Password updated successfully!');
      closeModal('changePassModal');
      document.getElementById('changePasswordForm').reset();
    } else {
      alert(data.message || 'Failed to update password');
    }
  } catch (err) {
    alert('Error connecting to database');
  }
}

// Tab Switching
function switchTab(tabName) {
  // Update sidebar highlighting
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Show selected panel
  document.querySelectorAll('.tab-panel').forEach(panel => {
    if (panel.id === `tab-${tabName}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });

  // Set header title
  const titleMap = {
    overview: 'Dashboard Overview',
    settings: 'Hero & Website Settings',
    projects: 'Project Portfolio Manager',
    services: 'Service Offerings Manager',
    testimonials: 'Client Testimonial Reviews',
    quotes: 'Quote Requests & Inquiries',
    media: 'Media Library & Files',
    announcements: 'Corporate Announcements',
    blog: 'News & Blog System'
  };
  document.getElementById('pageTitle').textContent = titleMap[tabName] || 'CMS Dashboard';
}

// Load All Content
async function loadAllData() {
  await Promise.all([
    fetchSettings(),
    fetchProjects(),
    fetchServices(),
    fetchTestimonials(),
    fetchQuotes(),
    fetchMedia(),
    fetchAnnouncements(),
    fetchBlog()
  ]);
  renderOverviewStats();
}

// Helper: Show Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Helper: Modals
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// ==========================================
// DATA FETCHING & RENDERING FUNCTIONS
// ==========================================

// 1. SETTINGS
async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      settings = await res.json();
      // Populate fields
      Object.keys(settings).forEach(key => {
        const input = document.getElementById(`set_${key}`);
        if (input) {
          input.value = settings[key];
        }
      });
    }
  } catch (e) { console.error('Failed to load settings', e); }
}

async function saveSettings(e) {
  e.preventDefault();
  const fields = [
    'hero_headline_line1', 'hero_headline_line2', 'hero_subheadline', 'contact_email', 'contact_phone',
    'contact_address', 'social_facebook', 'developer_name',
    'stats_projects_count', 'stats_clients_count', 'stats_experience_years'
  ];
  const payload = {};
  fields.forEach(field => {
    const input = document.getElementById(`set_${field}`);
    if (input) {
      payload[field] = input.value;
    }
  });

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Settings saved successfully!');
    }
  } catch (e) { alert('Failed to save settings'); }
}

// 2. PROJECTS
async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (res.ok) {
      projects = await res.json();
      renderProjects();
    }
  } catch (e) { console.error(e); }
}

function renderProjects() {
  const container = document.getElementById('projectsListTable');
  if (projects.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No projects found.</td></tr>`;
    return;
  }

  container.innerHTML = projects.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td><span class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; cursor: default;">${p.category}</span></td>
      <td>${p.duration || 'N/A'}</td>
      <td>
        ${p.beforeImage ? `<a href="/${p.beforeImage}" target="_blank" style="color:var(--accent-cyan)">Before</a>` : 'No Image'} / 
        ${p.afterImage ? `<a href="/${p.afterImage}" target="_blank" style="color:var(--accent-cyan)">After</a>` : 'No Image'}
      </td>
      <td>
        <button onclick="editProject(${p.id})" class="btn btn-secondary" style="padding:5px 10px; font-size:12px;"><i class="fa fa-edit"></i> Edit</button>
        <button onclick="deleteProject(${p.id})" class="btn btn-danger" style="padding:5px 10px; font-size:12px;"><i class="fa fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function openProjectModal(id = null) {
  document.getElementById('projectForm').reset();
  if (id) {
    const p = projects.find(proj => proj.id === id);
    document.getElementById('projId').value = p.id;
    document.getElementById('projTitle').value = p.title;
    document.getElementById('projCategory').value = p.category;
    document.getElementById('projStatus').value = p.status;
    document.getElementById('projDuration').value = p.duration || '';
    document.getElementById('projBeforePath').value = p.beforeImage || '';
    document.getElementById('projAfterPath').value = p.afterImage || '';
    document.getElementById('projDescription').value = p.description || '';
    document.getElementById('projLocation').value = p.location || '';
    document.getElementById('projClient').value = p.clientName || '';
    document.getElementById('projectModalTitle').textContent = 'Edit Project Showcase';
  } else {
    document.getElementById('projId').value = '';
    document.getElementById('projectModalTitle').textContent = 'Add Showcase Project';
  }
  openModal('projectModal');
}

function editProject(id) {
  openProjectModal(id);
}

async function saveProject(e) {
  e.preventDefault();
  const id = document.getElementById('projId').value;
  const title = document.getElementById('projTitle').value;
  const category = document.getElementById('projCategory').value;
  const status = document.getElementById('projStatus').value;
  const duration = document.getElementById('projDuration').value;
  const description = document.getElementById('projDescription').value;
  const location = document.getElementById('projLocation').value;
  const clientName = document.getElementById('projClient').value;
  const beforeFile = document.getElementById('projBeforeFile').files[0];
  const afterFile = document.getElementById('projAfterFile').files[0];
  const beforeUrl = document.getElementById('projBeforePath').value;
  const afterUrl = document.getElementById('projAfterPath').value;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('status', status);
  formData.append('duration', duration);
  formData.append('description', description);
  formData.append('location', location);
  formData.append('clientName', clientName);

  if (beforeFile) {
    formData.append('beforeImage', beforeFile);
  } else if (beforeUrl) {
    formData.append('beforeImage', beforeUrl);
  }

  if (afterFile) {
    formData.append('afterImage', afterFile);
  } else if (afterUrl) {
    formData.append('afterImage', afterUrl);
  }

  const url = id ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      showToast('Project saved successfully!');
      closeModal('projectModal');
      fetchProjects();
    }
  } catch (err) {
    alert('Failed to save project');
  }
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Project deleted!');
      fetchProjects();
    }
  } catch (e) { alert('Delete failed'); }
}

// 3. SERVICES
async function fetchServices() {
  try {
    const res = await fetch(`${API_BASE}/services`);
    if (res.ok) {
      services = await res.json();
      renderServices();
    }
  } catch (e) { console.error(e); }
}

function renderServices() {
  const container = document.getElementById('servicesListTable');
  if (services.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No services found.</td></tr>`;
    return;
  }
  container.innerHTML = services.map(s => `
    <tr>
      <td><i class="${s.icon}" style="font-size:18px; color:var(--accent-cyan);"></i></td>
      <td><strong>${s.name}</strong></td>
      <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.description}</td>
      <td>${s.isFeatured ? '<span class="text-success"><i class="fa fa-star"></i> Featured</span>' : '<span class="text-muted">Standard</span>'}</td>
      <td>
        <button onclick="editService(${s.id})" class="btn btn-secondary" style="padding:5px 10px; font-size:12px;"><i class="fa fa-edit"></i> Edit</button>
        <button onclick="deleteService(${s.id})" class="btn btn-danger" style="padding:5px 10px; font-size:12px;"><i class="fa fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function openServiceModal(id = null) {
  document.getElementById('serviceForm').reset();
  if (id) {
    const s = services.find(srv => srv.id === id);
    document.getElementById('srvId').value = s.id;
    document.getElementById('srvName').value = s.name;
    document.getElementById('srvIcon').value = s.icon;
    document.getElementById('srvDescription').value = s.description;
    document.getElementById('srvFeatured').checked = s.isFeatured;
    
    let bulletString = '';
    if (s.bullets) {
      const bulletsObj = typeof s.bullets === 'string' ? JSON.parse(s.bullets) : s.bullets;
      bulletString = Array.isArray(bulletsObj) ? bulletsObj.join('\n') : '';
    }
    document.getElementById('srvBullets').value = bulletString;
    document.getElementById('serviceModalTitle').textContent = 'Edit Service Offer';
  } else {
    document.getElementById('srvId').value = '';
    document.getElementById('serviceModalTitle').textContent = 'Add Service Card';
  }
  openModal('serviceModal');
}

function editService(id) {
  openServiceModal(id);
}

async function saveService(e) {
  e.preventDefault();
  const id = document.getElementById('srvId').value;
  const name = document.getElementById('srvName').value;
  const icon = document.getElementById('srvIcon').value;
  const description = document.getElementById('srvDescription').value;
  const isFeatured = document.getElementById('srvFeatured').checked;
  const bulletsRaw = document.getElementById('srvBullets').value;

  const bullets = bulletsRaw.split('\n').filter(b => b.trim() !== '');

  const payload = { name, icon, description, isFeatured, bullets: JSON.stringify(bullets) };
  const url = id ? `${API_BASE}/services/${id}` : `${API_BASE}/services`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Service saved!');
      closeModal('serviceModal');
      fetchServices();
    }
  } catch (e) { alert('Save failed'); }
}

async function deleteService(id) {
  if (!confirm('Delete this service card?')) return;
  try {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Service deleted');
      fetchServices();
    }
  } catch (e) { alert('Delete failed'); }
}

// 4. TESTIMONIALS
async function fetchTestimonials() {
  try {
    const res = await fetch(`${API_BASE}/testimonials/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      testimonials = await res.json();
      renderTestimonials();
    }
  } catch (e) { console.error(e); }
}

function renderTestimonials() {
  const container = document.getElementById('testimonialsListTable');
  if (testimonials.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No testimonials found.</td></tr>`;
    return;
  }
  container.innerHTML = testimonials.map(t => `
    <tr>
      <td><strong>${t.author}</strong></td>
      <td>${t.position}</td>
      <td>${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</td>
      <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${t.quote}"</td>
      <td>
        <input type="checkbox" ${t.isApproved ? 'checked' : ''} onchange="toggleTestimonialApproval(${t.id}, this.checked)">
      </td>
      <td>
        <button onclick="editTestimonial(${t.id})" class="btn btn-secondary" style="padding:5px 10px; font-size:12px;"><i class="fa fa-edit"></i> Edit</button>
        <button onclick="deleteTestimonial(${t.id})" class="btn btn-danger" style="padding:5px 10px; font-size:12px;"><i class="fa fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

async function toggleTestimonialApproval(id, isApproved) {
  try {
    const res = await fetch(`${API_BASE}/testimonials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isApproved })
    });
    if (res.ok) {
      showToast(isApproved ? 'Testimonial Approved!' : 'Testimonial Unapproved');
      fetchTestimonials();
    }
  } catch (e) { alert('Failed to update testimonial status'); }
}

function openTestimonialModal(id = null) {
  document.getElementById('testimonialForm').reset();
  if (id) {
    const t = testimonials.find(item => item.id === id);
    document.getElementById('testId').value = t.id;
    document.getElementById('testAuthor').value = t.author;
    document.getElementById('testPosition').value = t.position;
    document.getElementById('testRating').value = t.rating;
    document.getElementById('testQuote').value = t.quote;
    document.getElementById('testApproved').checked = t.isApproved;
    document.getElementById('testModalTitle').textContent = 'Edit Testimonial';
  } else {
    document.getElementById('testId').value = '';
    document.getElementById('testApproved').checked = true;
    document.getElementById('testModalTitle').textContent = 'Add Testimonial';
  }
  openModal('testimonialModal');
}

function editTestimonial(id) {
  openTestimonialModal(id);
}

async function saveTestimonial(e) {
  e.preventDefault();
  const id = document.getElementById('testId').value;
  const author = document.getElementById('testAuthor').value;
  const position = document.getElementById('testPosition').value;
  const rating = document.getElementById('testRating').value;
  const quote = document.getElementById('testQuote').value;
  const isApproved = document.getElementById('testApproved').checked;

  const payload = { author, position, rating, quote, isApproved };
  const url = id ? `${API_BASE}/testimonials/${id}` : `${API_BASE}/testimonials`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Testimonial saved!');
      closeModal('testimonialModal');
      fetchTestimonials();
    }
  } catch (e) { alert('Save failed'); }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    const res = await fetch(`${API_BASE}/testimonials/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Testimonial deleted');
      fetchTestimonials();
    }
  } catch (e) { alert('Delete failed'); }
}

// 5. QUOTES
async function fetchQuotes() {
  try {
    const res = await fetch(`${API_BASE}/quotes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      quotes = await res.json();
      renderQuotes();
      renderRecentQuotesOverview();
    }
  } catch (e) { console.error(e); }
}

function renderQuotes() {
  const container = document.getElementById('quotesListTable');
  if (quotes.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No quote requests found.</td></tr>`;
    return;
  }
  container.innerHTML = quotes.map(q => `
    <tr>
      <td><strong>${q.firstName} ${q.lastName}</strong></td>
      <td>${q.email}<br>${q.phone}</td>
      <td>${q.projectType}<br><small>${q.location}</small></td>
      <td>₱${parseFloat(q.budget).toLocaleString()}</td>
      <td style="max-width:250px; font-size:12px; white-space:pre-wrap;">${q.details}</td>
      <td>
        <select onchange="updateQuoteStatus(${q.id}, this.value)" style="padding:4px; font-size:12px; background:var(--secondary-dark); color:white; border:1px solid var(--border-color); border-radius:4px;">
          <option value="New" ${q.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Contacted" ${q.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="In Progress" ${q.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Archived" ${q.status === 'Archived' ? 'selected' : ''}>Archived</option>
        </select>
      </td>
      <td>
        <button onclick="deleteQuote(${q.id})" class="btn btn-danger" style="padding:5px 10px; font-size:12px;"><i class="fa fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

async function updateQuoteStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/quotes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      showToast('Status updated!');
      fetchQuotes();
    }
  } catch (e) { alert('Status update failed'); }
}

async function deleteQuote(id) {
  if (!confirm('Are you sure you want to delete this quote request record permanently?')) return;
  try {
    const res = await fetch(`${API_BASE}/quotes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Quote record deleted');
      fetchQuotes();
    }
  } catch (e) { alert('Delete failed'); }
}

// 6. MEDIA LIBRARY
async function fetchMedia() {
  try {
    const res = await fetch(`${API_BASE}/media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const files = await res.json();
      renderMedia(files);
    }
  } catch (e) { console.error(e); }
}

function renderMedia(files) {
  const container = document.getElementById('mediaLibraryGrid');
  if (files.length === 0) {
    container.innerHTML = `<div class="text-center text-muted" style="grid-column:1/-1;">No media files uploaded yet.</div>`;
    return;
  }

  container.innerHTML = files.map(file => `
    <div class="media-item">
      <img src="/${file.url}" alt="${file.name}">
      <div class="media-actions">
        <button onclick="copyToClipboard('${file.url}')" class="btn btn-secondary" style="padding:2px 6px; font-size:10px;" title="Copy path"><i class="fa fa-copy"></i> Copy Path</button>
        <button onclick="deleteMediaFile('${file.name}')" class="btn-delete-media" title="Delete"><i class="fa fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  showToast('Copied media URL to clipboard!');
}

async function uploadMediaFile(e) {
  e.preventDefault();
  const fileInput = document.getElementById('mediaFileInput');
  if (fileInput.files.length === 0) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      showToast('Media uploaded!');
      fileInput.value = '';
      fetchMedia();
    } else {
      const err = await res.json();
      alert(err.message || 'Upload failed');
    }
  } catch (e) { alert('Upload failed'); }
}

async function deleteMediaFile(filename) {
  if (!confirm('Are you sure you want to delete this file permanently?')) return;
  try {
    const res = await fetch(`${API_BASE}/media/${filename}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Media file deleted');
      fetchMedia();
    }
  } catch (e) { alert('Delete failed'); }
}

// 7. ANNOUNCEMENTS
async function fetchAnnouncements() {
  try {
    const res = await fetch(`${API_BASE}/announcements/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      announcements = await res.json();
      renderAnnouncements();
    }
  } catch (e) { console.error(e); }
}

function renderAnnouncements() {
  const container = document.getElementById('announcementsListTable');
  if (announcements.length === 0) {
    container.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No announcements.</td></tr>`;
    return;
  }
  container.innerHTML = announcements.map(a => `
    <tr>
      <td>${a.message}</td>
      <td>${a.link || '<span class="text-muted">None</span>'}</td>
      <td>
        <input type="checkbox" ${a.isActive ? 'checked' : ''} onchange="toggleAnnouncementActive(${a.id}, this.checked)">
      </td>
      <td>
        <button onclick="editAnnouncement(${a.id})" class="btn btn-secondary" style="padding:5px 10px; font-size:12px;"><i class="fa fa-edit"></i> Edit</button>
        <button onclick="deleteAnnouncement(${a.id})" class="btn btn-danger" style="padding:5px 10px; font-size:12px;"><i class="fa fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

async function toggleAnnouncementActive(id, isActive) {
  try {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive })
    });
    if (res.ok) {
      showToast(isActive ? 'Announcement Banner Active!' : 'Announcement Banner Disabled');
      fetchAnnouncements();
    }
  } catch (e) { alert('Failed to update announcement status'); }
}

function openAnnouncementModal(id = null) {
  document.getElementById('announcementForm').reset();
  if (id) {
    const a = announcements.find(item => item.id === id);
    document.getElementById('annId').value = a.id;
    document.getElementById('annMessage').value = a.message;
    document.getElementById('annLink').value = a.link || '';
    document.getElementById('annActive').checked = a.isActive;
    document.getElementById('annModalTitle').textContent = 'Edit Announcement';
  } else {
    document.getElementById('annId').value = '';
    document.getElementById('annActive').checked = true;
    document.getElementById('annModalTitle').textContent = 'Create Announcement';
  }
  openModal('announcementModal');
}

function editAnnouncement(id) {
  openAnnouncementModal(id);
}

async function saveAnnouncement(e) {
  e.preventDefault();
  const id = document.getElementById('annId').value;
  const message = document.getElementById('annMessage').value;
  const link = document.getElementById('annLink').value;
  const isActive = document.getElementById('annActive').checked;

  const payload = { message, link, isActive };
  const url = id ? `${API_BASE}/announcements/${id}` : `${API_BASE}/announcements`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Announcement saved!');
      closeModal('announcementModal');
      fetchAnnouncements();
    }
  } catch (e) { alert('Save failed'); }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement permanently?')) return;
  try {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Announcement deleted');
      fetchAnnouncements();
    }
  } catch (e) { alert('Delete failed'); }
}

// 8. BLOG
async function fetchBlog() {
  try {
    const res = await fetch(`${API_BASE}/blog/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      blogPosts = await res.json();
      renderBlogPosts();
    }
  } catch (e) { console.error(e); }
}

function renderBlogPosts() {
  const container = document.getElementById('blogListTable');
  if (blogPosts.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No blog posts found.</td></tr>`;
    return;
  }
  container.innerHTML = blogPosts.map(post => `
    <tr>
      <td>${post.featuredImage ? `<img src="/${post.featuredImage}" style="width:50px; height:45px; object-fit:cover; border-radius:4px;">` : 'No Image'}</td>
      <td><strong>${post.title}</strong></td>
      <td>${post.category || 'Uncategorized'}</td>
      <td>${post.published ? '<span class="text-success">Published</span>' : '<span class="text-muted">Draft</span>'}</td>
      <td>${new Date(post.createdAt).toLocaleDateString()}</td>
      <td>
        <button onclick="editBlog(${post.id})" class="btn btn-secondary" style="padding:5px 10px; font-size:12px;"><i class="fa fa-edit"></i> Edit</button>
        <button onclick="deleteBlog(${post.id})" class="btn btn-danger" style="padding:5px 10px; font-size:12px;"><i class="fa fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function openBlogModal(id = null) {
  document.getElementById('blogForm').reset();
  if (id) {
    const post = blogPosts.find(item => item.id === id);
    document.getElementById('blogId').value = post.id;
    document.getElementById('blogTitle').value = post.title;
    document.getElementById('blogCategory').value = post.category || '';
    document.getElementById('blogImage').value = post.featuredImage || '';
    document.getElementById('blogExcerpt').value = post.excerpt || '';
    document.getElementById('blogContent').value = post.content;
    document.getElementById('blogPublished').checked = post.published;
    document.getElementById('blogModalTitle').textContent = 'Edit Blog Article';
  } else {
    document.getElementById('blogId').value = '';
    document.getElementById('blogPublished').checked = true;
    document.getElementById('blogModalTitle').textContent = 'Write Article';
  }
  openModal('blogModal');
}

function editBlog(id) {
  openBlogModal(id);
}

async function saveBlog(e) {
  e.preventDefault();
  const id = document.getElementById('blogId').value;
  const title = document.getElementById('blogTitle').value;
  const category = document.getElementById('blogCategory').value;
  const featuredImage = document.getElementById('blogImage').value;
  const excerpt = document.getElementById('blogExcerpt').value;
  const content = document.getElementById('blogContent').value;
  const published = document.getElementById('blogPublished').checked;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const payload = { title, category, featuredImage, excerpt, content, published, slug };
  const url = id ? `${API_BASE}/blog/${id}` : `${API_BASE}/blog`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Article saved!');
      closeModal('blogModal');
      fetchBlog();
    }
  } catch (e) { alert('Save failed'); }
}

async function deleteBlog(id) {
  if (!confirm('Are you sure you want to delete this article?')) return;
  try {
    const res = await fetch(`${API_BASE}/blog/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Article deleted');
      fetchBlog();
    }
  } catch (e) { alert('Delete failed'); }
}

// ==========================================
// OVERVIEW RENDERING
// ==========================================
function renderOverviewStats() {
  document.getElementById('statQuotes').textContent = quotes.length;
  document.getElementById('statProjects').textContent = projects.length;
  document.getElementById('statTestimonials').textContent = testimonials.filter(t => t.isApproved).length;
}

function renderRecentQuotesOverview() {
  const container = document.getElementById('recentQuotesList');
  if (quotes.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No recent quote requests found.</td></tr>`;
    return;
  }

  // Get last 5 quotes
  const recent = quotes.slice(0, 5);
  container.innerHTML = recent.map(q => `
    <tr>
      <td><strong>${q.firstName} ${q.lastName}</strong></td>
      <td>${q.projectType}</td>
      <td>₱${parseFloat(q.budget).toLocaleString()}</td>
      <td><span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(0, 229, 255, 0.1); color: var(--accent-cyan); border: 1px solid var(--border-color);">${q.status}</span></td>
      <td>${new Date(q.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');
}
