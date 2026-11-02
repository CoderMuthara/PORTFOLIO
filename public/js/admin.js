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
  loadProjects();
  loadMessages();
}

// ---------- Messages ----------
const messageList = document.getElementById('message-list');

// Turns 0712 345 678 or +254 712 345 678 into 254712345678 (what WhatsApp links need)
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

    // Only show the WhatsApp button if the visitor left a number
        // Only show phone buttons if the visitor left a number
    let whatsappButton = '';
    let callButton = '';
    if (m.phone) {
      const text = encodeURIComponent(`Hi ${m.name}, thank you for reaching out through my portfolio.`);
      const number = toWhatsAppNumber(m.phone);
      const whatsappLink = `https://wa.me/${number}?text=${text}`;
      whatsappButton = `<a class="btn whatsapp" href="${whatsappLink}" target="_blank" rel="noopener">Reply on WhatsApp</a>`;
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
      ${p.image ? `<img class="project-img" src="/uploads/${escapeHtml(p.image)}" alt="">` : ''}
      <div class="project-body">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <p><strong>Tech:</strong> ${escapeHtml(p.tech)}</p>
        <button onclick="startEdit(${p.id})">Edit</button>
        <button onclick="deleteProject(${p.id})">Delete</button>
      </div>
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

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('tech', document.getElementById('tech').value);
  formData.append('live_url', document.getElementById('live_url').value);
  formData.append('code_url', document.getElementById('code_url').value);

  const imageFile = document.getElementById('image').files[0];
  if (imageFile) formData.append('image', imageFile);

  // Note: no Content-Type header here, the browser sets it for file uploads
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

checkLogin();