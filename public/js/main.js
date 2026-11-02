// Stops text from being treated as HTML (a security habit)
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- Skills (grouped by category) ----------
async function loadSkills() {
  const container = document.getElementById('skills-list');

  try {
    const response = await fetch('/api/skills');
    const skills = await response.json();

    if (skills.length === 0) {
      container.textContent = 'Skills coming soon.';
      return;
    }

    const groups = {};
    skills.forEach(s => {
      (groups[s.category] = groups[s.category] || []).push(s);
    });

    container.innerHTML = Object.keys(groups).map(category => `
      <div class="skill-group">
        <h3>${escapeHtml(category)}</h3>
        <ul class="skills">
          ${groups[category].map(s => `<li>${escapeHtml(s.name)}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  } catch (error) {
    container.textContent = 'Could not load skills.';
  }
}

// ---------- Projects (filter tabs + show more) ----------
const PAGE_SIZE = 6;
let allProjects = [];
let activeCategory = 'All';
let visibleCount = PAGE_SIZE;

function projectCard(p) {
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

  const chips = (p.tech || '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 5)
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
}

function renderFilters() {
  const filters = document.getElementById('project-filters');
  const categories = [...new Set(allProjects.map(p => p.category || 'Other'))];

  // No need for tabs if there's only one category
  if (categories.length < 2) {
    filters.innerHTML = '';
    return;
  }

  filters.innerHTML = ['All', ...categories].map(c => `
    <button type="button" class="filter ${c === activeCategory ? 'active' : ''}"
            data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>
  `).join('');
}

function renderProjects() {
  const grid = document.getElementById('project-grid');
  const moreButton = document.getElementById('show-more');

  const filtered = activeCategory === 'All'
    ? allProjects
    : allProjects.filter(p => (p.category || 'Other') === activeCategory);

  if (filtered.length === 0) {
    grid.textContent = 'Projects coming soon.';
    moreButton.hidden = true;
    return;
  }

  grid.innerHTML = filtered.slice(0, visibleCount).map(projectCard).join('');
  moreButton.hidden = filtered.length <= visibleCount;
}

async function loadProjects() {
  const grid = document.getElementById('project-grid');

  try {
    const response = await fetch('/api/projects');
    allProjects = await response.json();
    renderFilters();
    renderProjects();
  } catch (error) {
    grid.textContent = 'Could not load projects.';
  }
}

document.getElementById('project-filters').addEventListener('click', (event) => {
  const button = event.target.closest('.filter');
  if (!button) return;

  activeCategory = button.dataset.category;
  visibleCount = PAGE_SIZE;
  renderFilters();
  renderProjects();
});

document.getElementById('show-more').addEventListener('click', () => {
  visibleCount += PAGE_SIZE;
  renderProjects();
});

// ---------- Profile photo ----------
async function loadProfile() {
  try {
    const response = await fetch('/api/profile');
    const { photo } = await response.json();
    if (!photo) return;

    const img = document.getElementById('profile-photo');
    img.src = '/uploads/' + encodeURIComponent(photo);
    img.hidden = false;
    img.tabIndex = 0;
    img.title = 'Click to enlarge';
  } catch (error) {
    // No photo, the page simply shows the text
  }
}

// ---------- Photo magnifier ----------
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const profilePhoto = document.getElementById('profile-photo');

function openLightbox() {
  if (!profilePhoto.src) return;
  lightboxImg.src = profilePhoto.src;
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
}

profilePhoto.addEventListener('click', openLightbox);
profilePhoto.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') openLightbox();
});

// Click anywhere on the dark background (or the X) to close
lightbox.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});

loadProfile();
loadSkills();
loadProjects();

// ---------- Contact form ----------
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