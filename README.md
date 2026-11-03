Kelvin Muthara | Full-Stack Developer Portfolio
A full-stack portfolio website with a private admin dashboard. Everything on the public site (projects, skills, certifications, profile photo and CV) is managed from the dashboard, so no code changes are needed to update it.
Live site: add your link here once deployed
Portfolio home page
Table of contents
Features
Tech stack
Run it locally
Environment variables
Using the admin dashboard
Project structure
Database
API reference
Security
Deployment
Troubleshooting
What I learned
Contact
Features
Public site
Hero with a profile photo that enlarges when clicked, and a CV download button that appears once a CV is uploaded
About section
Skills shown as one card per category (Software Development, Networking, Cybersecurity and more), each with a skill count and a button that filters the projects by that category
Projects with category filter tabs, a "Show more" button, image previews, and cards that open GitHub (or the live demo) when clicked
Certifications with certificate previews that enlarge when clicked, and links to verify online. The section stays hidden until the first certificate is added
Contact section with a message form, WhatsApp and call buttons, and a CV download button
Responsive layout: columns on desktop, a single column on phones
Admin dashboard
Login-protected page at /admin.html
Add, edit and delete projects, with image upload, category and tags
Add, edit and delete skills, grouped by category
Add, edit and delete certifications, with an image or PDF and an optional verification link
Upload or remove the profile photo and the CV
Read visitor messages and reply by email, Gmail, WhatsApp or phone
Tech stack
Part Technology
Frontend HTML, CSS, vanilla JavaScript
Backend Node.js, Express
Database SQLite (better-sqlite3)
Authentication bcryptjs password hashing, JSON Web Tokens in an httpOnly cookie
File uploads multer
Security helmet, express-rate-limit, input validation
Configuration dotenv
Run it locally
You need Node.js (LTS version) and Git installed.

1.  Clone the repository and install dependencies
2.  git clone https://github.com/YOUR-GITHUB-USERNAME/portfolio.git
    cd portfolio
    npm install
3.
4.  Create your .env file
5.  Copy .env.example to .env:
6.  cp .env.example .env
7.  On Windows PowerShell, use copy .env.example .env instead.
8.
9.  Generate your secrets and put them in .env
10. Create a password hash for the admin login (replace your-password with a strong password of your own):
11. node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
12. Create a random key for signing login tokens:
13. node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
14. Open .env, paste the results in, and keep single quotes around the hash because it contains $ characters:
15. ADMIN_USERNAME=admin
    ADMIN_PASSWORD_HASH='paste-the-hash-here'
    JWT_SECRET=paste-the-random-key-here
16.
17. Start the server
18. npm start
19.
20. Open the site
21. oPublic site: http://localhost:3000
    oAdmin dashboard: http://localhost:3000/admin.html
    The database file (db/portfolio.db) and the public/uploads/ folder are created automatically the first time the server runs.
    Environment variables
    Variable Required Description
    ADMIN_USERNAME Yes Username for the admin login
    ADMIN_PASSWORD_HASH Yes bcrypt hash of the admin password (never the password itself)
    JWT_SECRET Yes Long random string used to sign login tokens
    PORT No Port to run on (defaults to 3000)
    NODE_ENV No Set to production when deployed, which turns on secure cookies and proxy support
    The server refuses to start if a required variable is missing. Never commit your real .env file. It is listed in .gitignore, and .env.example shows the format without real values.
    Using the admin dashboard
    1.Go to /admin.html and log in. The login lasts 2 hours.
    2.Profile photo: upload a JPG, PNG or WebP under 2 MB. A square photo works best.
    3.CV: upload a PDF under 3 MB. The download buttons appear on the site automatically.
    4.Skills: add a skill and pick a category. Use the suggested category names so that skills and projects match each other.
    5.Projects: add a title, category, description, comma-separated tags, links and a screenshot. Leave the image empty when editing to keep the current one.
    6.Certifications: add the course, issuer and month, plus a certificate image (or PDF) and a verification link such as Credly. An image gives a preview on the site.
    7.Messages: read messages from the contact form and reply using the buttons on each one.
    Project structure
    portfolio/
    ├── db/
    │ └── database.js # database connection and table setup
    ├── middleware/
    │ └── auth.js # checks the login cookie
    ├── routes/
    │ ├── auth.js # login, logout, login check
    │ ├── certifications.js # certifications CRUD and uploads
    │ ├── contact.js # contact form and messages
    │ ├── profile.js # profile photo and CV
    │ ├── projects.js # projects CRUD and image uploads
    │ └── skills.js # skills CRUD
    ├── public/
    │ ├── css/style.css # all styles
    │ ├── js/
    │ │ ├── main.js # public site logic
    │ │ └── admin.js # dashboard logic
    │ ├── uploads/ # uploaded files (not committed)
    │ ├── index.html # public site
    │ └── admin.html # admin dashboard
    ├── .env.example # template for your environment variables
    ├── .gitignore
    ├── package.json
    └── server.js # app entry point
    Database
    SQLite stores everything in a single file. Tables are created automatically on startup.
    Table Holds
    projects title, description, tech tags, category, links, image
    skills name, category
    certifications title, issuer, month earned, verification link, file
    messages name, email, phone, message, date
    settings profile photo and CV file names
    API reference
    Routes marked Admin need a valid login cookie and return 401 without one.
    Method Route Access Purpose
    POST /api/auth/login Public (rate limited) Log in
    POST /api/auth/logout Public Log out
    GET /api/auth/check Admin Check if logged in
    GET /api/projects Public List projects
    POST /api/projects Admin Add a project
    PUT /api/projects/:id Admin Edit a project
    DELETE /api/projects/:id Admin Delete a project
    GET /api/skills Public List skills
    POST /api/skills Admin Add a skill
    PUT /api/skills/:id Admin Edit a skill
    DELETE /api/skills/:id Admin Delete a skill
    GET /api/certifications Public List certifications
    POST /api/certifications Admin Add a certification
    PUT /api/certifications/:id Admin Edit a certification
    DELETE /api/certifications/:id Admin Delete a certification
    POST /api/contact Public (rate limited) Send a message
    GET /api/contact Admin Read messages
    DELETE /api/contact/:id Admin Delete a message
    GET /api/profile Public Get the photo and CV file names
    POST /api/profile/photo Admin Upload the profile photo
    DELETE /api/profile/photo Admin Remove the profile photo
    POST /api/profile/cv Admin Upload the CV
    DELETE /api/profile/cv Admin Remove the CV
    Security
    Passwords are stored only as bcrypt hashes, and the login error message does not reveal whether the username or the password was wrong
    Login tokens live in an httpOnly, sameSite=strict cookie (and secure in production), so scripts in the browser cannot read them
    Every route that changes data is protected by the login check on the server, not just hidden in the interface
    All database queries are parameterized, which prevents SQL injection
    User-provided text is escaped before it is shown on a page, which prevents cross-site scripting
    Uploads are limited by type (JPG, PNG, WebP and PDF only, no SVG) and size, renamed to random file names, and PDFs are checked for a real PDF signature
    helmet sets security headers, including a Content Security Policy that only allows scripts from the site itself
    Rate limits: 10 login attempts per 15 minutes and 10 contact messages per hour for each visitor
    Request bodies are limited to 10 KB, and error details are logged on the server instead of shown to visitors

Contact
Email: mutharakelvin4@gmail.com
GitHub:https://github.com/CoderMuthara
LinkedIn:
WhatsApp: +254 762784914
Built by Kelvin Muthara.
