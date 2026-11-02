// Stops text from being treated as HTML (a security habit)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Only show a link if it's a real URL (not empty or the "#" placeholder)
function linkIfValid(url, label) {
  if (!url || url === '#') return '';
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>`;
}

async function loadProjects() {
  const container = document.getElementById('projects');

  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();

    if (projects.length === 0) {
      container.textContent = 'Projects coming soon.';
      return;
    }

    container.innerHTML = projects.map(p => `
      <article class="project">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <p class="tech"><strong>Tech:</strong> ${escapeHtml(p.tech)}</p>
        <p class="links">
          ${linkIfValid(p.live_url, 'Live')}
          ${linkIfValid(p.code_url, 'Code')}
        </p>
      </article>
    `).join('');
  } catch (error) {
    container.textContent = 'Could not load projects.';
  }
}

loadProjects();

// ---- Contact form ----
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (response.ok) {
      formStatus.textContent = 'Message sent. Thank you!';
      form.reset();
    } else {
      formStatus.textContent = result.error;
    }
  } catch (error) {
    formStatus.textContent = 'Something went wrong. Please try again.';
  }
});