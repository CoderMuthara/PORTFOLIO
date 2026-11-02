const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

const projectForm = document.getElementById('project-form');
const projectStatus = document.getElementById('project-status');
const projectList = document.getElementById('project-list');
const formTitle = document.getElementById('form-title');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

let projects = [];

// Stops text from being treated as HTML (a security habit)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  loadProjects();
  loadMessages();
}

// ---------- Messages ----------
const messageList = document.getElementById('message-list');

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

    return `
      <div class="message">
        <p><strong>${escapeHtml(m.name)}</strong> (${escapeHtml(m.email)})</p>
        <p><small>${new Date(m.created_at + 'Z').toLocaleString()}</small></p>
        <p style="white-space: pre-wrap;">${escapeHtml(m.message)}</p>
        <a class="btn" href="${mailtoLink}">Reply</a>
        <a class="btn outline" href="${gmailLink}" target="_blank" rel="noopener">Reply in Gmail</a>
        <button onclick="deleteMessage(${m.id})">Delete</button>
      </div>
    `;
  }).join('');
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;

  const response = await fetch(`/api/contact/${id}`, { method: 'DELETE' });

  if (response.status === 401) return showLogin();

  if (response.ok) {
    loadMessages();
  }
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

// ---------- Projects ----------
async function loadProjects() {
  const response = await fetch('/api/projects');
  projects = await response.json();

  if (projects.length === 0) {
    projectList.textContent = 'No projects yet.';
    return;
  }

  projectList.innerHTML = projects.map(p => `
    <div class="project">
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <p><strong>Tech:</strong> ${escapeHtml(p.tech)}</p>
      <button onclick="startEdit(${p.id})">Edit</button>
      <button onclick="deleteProject(${p.id})">Delete</button>
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
  document.getElementById('description').value = p.description;
  document.getElementById('tech').value = p.tech;
  document.getElementById('live_url').value = p.live_url === '#' ? '' : p.live_url;
  document.getElementById('code_url').value = p.code_url === '#' ? '' : p.code_url;

  formTitle.textContent = 'Edit project';
  saveBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelBtn.addEventListener('click', resetForm);

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = document.getElementById('project-id').value;
  const data = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    tech: document.getElementById('tech').value,
    live_url: document.getElementById('live_url').value,
    code_url: document.getElementById('code_url').value
  };

  // If there's an id we are editing (PUT), otherwise adding (POST)
  const response = await fetch(id ? `/api/projects/${id}` : '/api/projects', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
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

checkLogin();