// Stops text from being treated as HTML (a security habit)
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

    container.innerHTML = projects.map(p => {
      const hasCode = p.code_url && p.code_url !== '#';
      const hasLive = p.live_url && p.live_url !== '#';

      // The whole card opens GitHub, or the live link if there's no GitHub link
      const mainUrl = hasCode ? p.code_url : (hasLive ? p.live_url : '');
      const cta = hasCode ? 'View on GitHub →' : 'View project →';

      const image = p.image
        ? `<img class="work-img" src="/uploads/${escapeHtml(p.image)}"
                alt="Screenshot of ${escapeHtml(p.title)}" loading="lazy">`
        : `<div class="work-img placeholder">${escapeHtml(p.title.charAt(0).toUpperCase())}</div>`;

      const category = p.category
        ? `<span class="work-category">${escapeHtml(p.category)}</span>`
        : '';

      const chips = p.tech
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => `<li>${escapeHtml(tag)}</li>`)
        .join('');

      const title = mainUrl
        ? `<a href="${escapeHtml(mainUrl)}" target="_blank" rel="noopener">${escapeHtml(p.title)}</a>`
        : escapeHtml(p.title);

      const liveLink = hasCode && hasLive
        ? `<a class="work-live" href="${escapeHtml(p.live_url)}" target="_blank" rel="noopener">Live demo</a>`
        : '';

      return `
        <article class="work-card">
          ${image}
          <div class="work-body">
            ${category}
            <h3 class="work-title">${title}</h3>
            <p class="work-desc">${escapeHtml(p.description)}</p>
            <ul class="work-chips">${chips}</ul>
            <div class="work-actions">
              ${mainUrl ? `<span class="work-btn">${cta}</span>` : ''}
              ${liveLink}
            </div>
          </div>
        </article>
      `;
    }).join('');
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
    phone: document.getElementById('phone').value,
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