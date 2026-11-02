const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
}

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
}

// On page load, check if we're already logged in
async function checkLogin() {
  const response = await fetch('/api/auth/check');
  if (response.ok) {
    showDashboard();
  } else {
    showLogin();
  }
}

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

checkLogin();