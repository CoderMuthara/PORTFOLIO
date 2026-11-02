async function loadProjects() {
  const container = document.getElementById('projects');

  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();

    container.innerHTML = projects.map(p => `
      <div class="project">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p><strong>Tech:</strong> ${p.tech}</p>
        <a href="${p.live_url}">Live</a> |
        <a href="${p.code_url}">Code</a>
      </div>
    `).join('');
  } catch (error) {
    container.textContent = 'Could not load projects.';
  }
}

loadProjects();