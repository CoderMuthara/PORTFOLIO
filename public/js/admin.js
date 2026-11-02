const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

// Stops text from being treated as HTML (a security habit)
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  loadProfile();
  loadSkills();
  loadProjects();
  loadCerts();
  loadMessages();
}

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
}

async function checkLogin() {
  const response = await fetch('/api/auth/check');
  if (response.ok) {
    showDashboard();
  } else {
    showLogin();
  }
}

// ---------- Login / logout ----------
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    })
  });
  const result = await response.json();

  if (response.ok) {
    loginForm.reset();
    loginStatus.textContent = '';
    showDashboard();
  } else {
    loginStatus.textContent = result.error;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  showLogin();
});

// ---------- Skills ----------
const skillForm = document.getElementById('skill-form');
const skillList = document.getElementById('skill-list');
const skillStatus = document.getElementById('skill-status');
const skillSaveBtn = document.getElementById('skill-save-btn');
const skillCancelBtn = document.getElementById('skill-cancel-btn');
let skills = [];

async function loadSkills() {
  const response = await fetch('/api/skills');
  skills = await response.json();

  if (skills.length === 0) {
    skillList.textContent = 'No skills yet.';
    return;
  }

  const groups = {};
  skills.forEach(s => {
    (groups[s.category] = groups[s.category] || []).push(s);
  });

  skillList.innerHTML = Object.keys(groups).map(category => `
    <div class="skill-group">
      <h3>${escapeHtml(category)}</h3>
      <ul class="skills">
        ${groups[category].map(s => `
          <li>
            ${escapeHtml(s.name)}
            <button class="mini ghost" onclick="startSkillEdit(${s.id})">Edit</button>
            <button class="mini danger" onclick="deleteSkill(${s.id})">×</button>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

function resetSkillForm() {
  skillForm.reset();
  document.getElementById('skill-id').value = '';
  skillSaveBtn.textContent = 'Add skill';
  skillCancelBtn.hidden = true;
}

function startSkillEdit(id) {
  const s = skills.find(skill => skill.id === id);
  document.getElementById('skill-id').value = s.id;
  document.getElementById('skill-name').value = s.name;
  document.getElementById('skill-category').value = s.category;
  skillSaveBtn.textContent = 'Save changes';
  skillCancelBtn.hidden = false;
  document.getElementById('skill-name').focus();
}

skillCancelBtn.addEventListener('click', resetSkillForm);

skillForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = document.getElementById('skill-id').value;
  const response = await fetch(id ? `/api/skills/${id}` : '/api/skills', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('skill-name').value,
      category: document.getElementById('skill-category').value
    })
  });
  const result = await response.json();

  if (response.status === 401) return showLogin();

  if (response.ok) {
    skillStatus.textContent = id ? 'Skill updated.' : 'Skill added.';
    resetSkillForm();
    loadSkills();
  } else {
    skillStatus.textContent = result.error;
  }
});

async function deleteSkill(id) {
  if (!confirm('Delete this skill?')) return;

  const response = await fetch(`/api/skills/${id}`, { method: 'DELETE' });

  if (response.status === 401) return showLogin();
  if (response.ok) loadSkills();
}

// ---------- Projects ----------
const projectForm = document.getElementById('project-form');
const projectStatus = document.getElementById('project-status');
const projectList = document.getElementById('project-list');
const formTitle = document.getElementById('form-title');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
let projects = [];

async function loadProjects() {
  const response = await fetch('/api/projects');
  projects = await response.json();

  if (projects.length === 0) {
    projectList.textContent = 'No projects yet.';
    return;
  }

  projectList.innerHTML = projects.map(p => `
    <div class="project">
      ${p.image ? `<img class="project-img" src="/uploads/${escapeHtml(p.image)}" alt="">` : ''}
      <h3>${escapeHtml(p.title)}</h3>
      <p><small>${escapeHtml(p.category || 'No category')}</small></p>
      <p>${escapeHtml(p.description)}</p>
      <button class="ghost" onclick="startEdit(${p.id})">Edit</button>
      <button class="danger" onclick="deleteProject(${p.id})">Delete</button>
    </div>
  `).join('');
}

function resetForm() {
  projectForm.reset();
  document.getElementById('project-id').value = '';
  formTitle.textContent = 'Add a project';
  saveBtn.textContent = 'Add project';
  cancelBtn.hidden = true;
}

function startEdit(id) {
  const p = projects.find(project => project.id === id);
  document.getElementById('project-id').value = p.id;
  document.getElementById('title').value = p.title;
  document.getElementById('category').value = p.category || '';
  document.getElementById('description').value = p.description;
  document.getElementById('tech').value = p.tech;
  document.getElementById('live_url').value = p.live_url === '#' ? '' : p.live_url;
  document.getElementById('code_url').value = p.code_url === '#' ? '' : p.code_url;

  formTitle.textContent = 'Edit project';
  saveBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;
  projectForm.scrollIntoView({ behavior: 'smooth' });
}

cancelBtn.addEventListener('click', resetForm);

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = document.getElementById('project-id').value;

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('tech', document.getElementById('tech').value);
  formData.append('live_url', document.getElementById('live_url').value);
  formData.append('code_url', document.getElementById('code_url').value);

  const imageFile = document.getElementById('image').files[0];
  if (imageFile) formData.append('image', imageFile);

  // No Content-Type header here, the browser sets it for file uploads
  const response = await fetch(id ? `/api/projects/${id}` : '/api/projects', {
    method: id ? 'PUT' : 'POST',
    body: formData
  });
  const result = await response.json();

  if (response.status === 401) return showLogin();

  if (response.ok) {
    projectStatus.textContent = id ? 'Project updated.' : 'Project added.';
    resetForm();
    loadProjects();
  } else {
    projectStatus.textContent = result.error;
  }
});

async function deleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;

  const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });

  if (response.status === 401) return showLogin();

  if (response.ok) {
    loadProjects();
  } else {
    projectStatus.textContent = 'Could not delete the project.';
  }
}

// ---------- Messages ----------
const messageList = document.getElementById('message-list');

// Turns 0712 345 678 or +254 712 345 678 into 254712345678
function toWhatsAppNumber(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '254' + digits.slice(1);
  if (digits.length === 9) digits = '254' + digits;
  return digits;
}

async function loadMessages() {
  const response = await fetch('/api/contact');

  if (response.status === 401) return showLogin();

  const messages = await response.json();

  if (messages.length === 0) {
    messageList.textContent = 'No messages yet.';
    return;
  }

  messageList.innerHTML = messages.map(m => {
    const subject = encodeURIComponent('Re: Your message on my portfolio');
    const body = encodeURIComponent(`Hi ${m.name},\n\nThank you for reaching out.\n\n`);
    const to = encodeURIComponent(m.email);

    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
    const gmailLink = `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`;

    let whatsappButton = '';
    let callButton = '';
    if (m.phone) {
      const text = encodeURIComponent(`Hi ${m.name}, thank you for reaching out through my portfolio.`);
      const number = toWhatsAppNumber(m.phone);
      whatsappButton = `<a class="btn whatsapp" href="https://wa.me/${number}?text=${text}" target="_blank" rel="noopener">Reply on WhatsApp</a>`;
      callButton = `<a class="btn outline" href="tel:+${number}">Call</a>`;
    }

    return `
      <div class="message">
        <p><strong>${escapeHtml(m.name)}</strong> (${escapeHtml(m.email)})</p>
        ${m.phone ? `<p>Phone: ${escapeHtml(m.phone)}</p>` : ''}
        <p><small>${new Date(m.created_at + 'Z').toLocaleString()}</small></p>
        <p style="white-space: pre-wrap;">${escapeHtml(m.message)}</p>
        <a class="btn" href="${mailtoLink}">Reply</a>
        <a class="btn outline" href="${gmailLink}" target="_blank" rel="noopener">Reply in Gmail</a>
        ${whatsappButton}
        ${callButton}
        <button class="danger" onclick="deleteMessage(${m.id})">Delete</button>
      </div>
    `;
  }).join('');
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;

  const response = await fetch(`/api/contact/${id}`, { method: 'DELETE' });

  if (response.status === 401) return showLogin();
  if (response.ok) loadMessages();
}

// ---------- Profile photo and CV ----------
const photoForm = document.getElementById('photo-form');
const photoPreview = document.getElementById('photo-preview');
const photoStatus = document.getElementById('photo-status');
const photoRemove = document.getElementById('photo-remove');

const cvForm = document.getElementById('cv-form');
const cvCurrent = document.getElementById('cv-current');
const cvStatus = document.getElementById('cv-status');
const cvRemove = document.getElementById('cv-remove');

async function loadProfile() {
  const response = await fetch('/api/profile');
  const { photo, cv } = await response.json();

  photoPreview.innerHTML = photo
    ? `<img class="profile-photo small" src="/uploads/${escapeHtml(photo)}" alt="Your profile photo">`
    : '<p>No photo yet.</p>';
  photoRemove.hidden = !photo;

  cvCurrent.innerHTML = cv
    ? `<p>Current CV: <a href="/uploads/${escapeHtml(cv)}" target="_blank" rel="noopener">view PDF</a></p>`
    : '<p>No CV uploaded yet.</p>';
  cvRemove.hidden = !cv;
}

// One function for both uploads, with clear messages for every outcome
async function uploadFile(url, field, fileInput, statusEl, form, successMessage) {
  const file = fileInput.files[0];
  if (!file) {
    statusEl.textContent = 'Please choose a file first.';
    return;
  }

  const formData = new FormData();
  formData.append(field, file);
  statusEl.textContent = 'Uploading...';

  try {
    const response = await fetch(url, { method: 'POST', body: formData });

    if (response.status === 401) return showLogin();
    if (response.status === 404) {
      statusEl.textContent = 'Upload route not found. Restart the server.';
      return;
    }

    const result = await response.json();

    if (response.ok) {
      statusEl.textContent = successMessage;
      form.reset();
      loadProfile();
    } else {
      statusEl.textContent = result.error;
    }
  } catch (error) {
    statusEl.textContent = 'Upload failed. Check the browser console and the terminal.';
    console.error(error);
  }
}

photoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  uploadFile('/api/profile/photo', 'photo', document.getElementById('photo'),
             photoStatus, photoForm, 'Photo updated.');
});

cvForm.addEventListener('submit', (event) => {
  event.preventDefault();
  uploadFile('/api/profile/cv', 'cv', document.getElementById('cv'),
             cvStatus, cvForm, 'CV uploaded.');
});

async function removeItem(url, statusEl, message) {
  const response = await fetch(url, { method: 'DELETE' });

  if (response.status === 401) return showLogin();
  if (response.ok) {
    statusEl.textContent = message;
    loadProfile();
  }
}

photoRemove.addEventListener('click', () => {
  if (confirm('Remove your profile photo?')) {
    removeItem('/api/profile/photo', photoStatus, 'Photo removed.');
  }
});

cvRemove.addEventListener('click', () => {
  if (confirm('Remove your CV?')) {
    removeItem('/api/profile/cv', cvStatus, 'CV removed.');
  }
});

// ---------- Certifications ----------
const certForm = document.getElementById('cert-form');
const certList = document.getElementById('cert-list');
const certStatus = document.getElementById('cert-status');
const certFormTitle = document.getElementById('cert-form-title');
const certSaveBtn = document.getElementById('cert-save-btn');
const certCancelBtn = document.getElementById('cert-cancel-btn');
let certs = [];

async function loadCerts() {
  const response = await fetch('/api/certifications');
  certs = await response.json();

  if (certs.length === 0) {
    certList.textContent = 'No certifications yet.';
    return;
  }

  certList.innerHTML = certs.map(c => `
    <div class="project">
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.issuer)}${c.issued ? ' · ' + escapeHtml(c.issued) : ''}</p>
      ${c.file ? `<p><a href="/uploads/${encodeURIComponent(c.file)}" target="_blank" rel="noopener">View file</a></p>` : ''}
      <button class="ghost" onclick="startCertEdit(${c.id})">Edit</button>
      <button class="danger" onclick="deleteCert(${c.id})">Delete</button>
    </div>
  `).join('');
}

function resetCertForm() {
  certForm.reset();
  document.getElementById('cert-id').value = '';
  certFormTitle.textContent = 'Add a certification';
  certSaveBtn.textContent = 'Add certification';
  certCancelBtn.hidden = true;
}

function startCertEdit(id) {
  const c = certs.find(cert => cert.id === id);
  document.getElementById('cert-id').value = c.id;
  document.getElementById('cert-title').value = c.title;
  document.getElementById('cert-issuer').value = c.issuer;
  document.getElementById('cert-issued').value = c.issued || '';
  document.getElementById('cert-url').value = c.credential_url || '';

  certFormTitle.textContent = 'Edit certification';
  certSaveBtn.textContent = 'Save changes';
  certCancelBtn.hidden = false;
  certForm.scrollIntoView({ behavior: 'smooth' });
}

certCancelBtn.addEventListener('click', resetCertForm);

certForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = document.getElementById('cert-id').value;

  const formData = new FormData();
  formData.append('title', document.getElementById('cert-title').value);
  formData.append('issuer', document.getElementById('cert-issuer').value);
  formData.append('issued', document.getElementById('cert-issued').value);
  formData.append('credential_url', document.getElementById('cert-url').value);

  const file = document.getElementById('cert-file').files[0];
  if (file) formData.append('file', file);

  certStatus.textContent = 'Saving...';

  try {
    const response = await fetch(id ? `/api/certifications/${id}` : '/api/certifications', {
      method: id ? 'PUT' : 'POST',
      body: formData
    });

    if (response.status === 401) return showLogin();
    if (response.status === 404) {
      certStatus.textContent = 'Route not found. Check server.js and restart the server.';
      return;
    }

    const result = await response.json();

    if (response.ok) {
      certStatus.textContent = id ? 'Certification updated.' : 'Certification added.';
      resetCertForm();
      loadCerts();
    } else {
      certStatus.textContent = result.error;
    }
  } catch (error) {
    certStatus.textContent = 'Something went wrong. Check the browser console.';
    console.error(error);
  }
});

async function deleteCert(id) {
  if (!confirm('Delete this certification?')) return;

  const response = await fetch(`/api/certifications/${id}`, { method: 'DELETE' });

  if (response.status === 401) return showLogin();
  if (response.ok) loadCerts();
}

checkLogin();