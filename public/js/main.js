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

const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stops the page from reloading

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
      status.textContent = 'Message sent. Thank you!';
      form.reset();
    } else {
      status.textContent = result.error;
    }
  } catch (error) {
    status.textContent = 'Something went wrong. Please try again.';
  }
});