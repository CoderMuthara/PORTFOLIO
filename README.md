# Kelvin Muthara | Full-Stack Developer Portfolio

A full-stack portfolio website with a private admin dashboard. Everything on the public site (projects, skills, certifications, profile photo and CV) is managed from the dashboard, so no code changes are needed to update it.

**Live site:** _add your link here once deployed_

![Portfolio home page](docs/screenshot-home.png)

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Using the admin dashboard](#using-the-admin-dashboard)
- [Project structure](#project-structure)
- [Database](#database)
- [API reference](#api-reference)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [What I learned](#what-i-learned)
- [Contact](#contact)

## Features

### Public site

- **Hero** with a profile photo that enlarges when clicked, and a CV download button that appears once a CV is uploaded
- **About** section
- **Skills** shown as one card per category (Software Development, Networking, Cybersecurity and more), each with a skill count and a button that filters the projects by that category
- **Projects** with category filter tabs, a "Show more" button, image previews, and cards that open GitHub (or the live demo) when clicked
- **Certifications** with certificate previews that enlarge when clicked, and links to verify online. The section stays hidden until the first certificate is added
- **Contact** section with a message form, WhatsApp and call buttons, and a CV download button
- Responsive layout: columns on desktop, a single column on phones

### Admin dashboard

- Login-protected page at `/admin.html`
- Add, edit and delete **projects**, with image upload, category and tags
- Add, edit and delete **skills**, grouped by category
- Add, edit and delete **certifications**, with an image or PDF and an optional verification link
- Upload or remove the **profile photo** and the **CV**
- Read visitor **messages** and reply by email, Gmail, WhatsApp or phone

## Tech stack

| Part           | Technology                                                           |
| -------------- | -------------------------------------------------------------------- |
| Frontend       | HTML, CSS, vanilla JavaScript                                        |
| Backend        | Node.js, Express                                                     |
| Database       | SQLite (`better-sqlite3`)                                            |
| Authentication | `bcryptjs` password hashing, JSON Web Tokens in an `httpOnly` cookie |
| File uploads   | `multer`                                                             |
| Security       | `helmet`, `express-rate-limit`, input validation                     |
| Configuration  | `dotenv`                                                             |

## Run it locally

You need [Node.js](https://nodejs.org) (LTS version) and Git installed.

1. **Clone the repository and install dependencies**

   ```bash
   git clone https://github.com/CoderMuthara/portfolio.git
   cd portfolio
   npm install
   ```

2. **Create your `.env` file**

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `copy .env.example .env` instead.

3. **Generate your secrets and put them in `.env`**

   Create a password hash for the admin login (replace `your-password` with a strong password of your own):

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```

   Create a random key for signing login tokens:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Open `.env`, paste the results in, and keep single quotes around the hash because it contains `$` characters:

   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH='paste-the-hash-here'
   JWT_SECRET=paste-the-random-key-here
   ```

4. **Start the server**

   ```bash
   npm start
   ```

5. **Open the site**
   - Public site: <http://localhost:3000>
   - Admin dashboard: <http://localhost:3000/admin.html>

The database file (`db/portfolio.db`) and the `public/uploads/` folder are created automatically the first time the server runs.

## Environment variables

| Variable              | Required | Description                                                                        |
| --------------------- | -------- | ---------------------------------------------------------------------------------- |
| `ADMIN_USERNAME`      | Yes      | Username for the admin login                                                       |
| `ADMIN_PASSWORD_HASH` | Yes      | bcrypt hash of the admin password (never the password itself)                      |
| `JWT_SECRET`          | Yes      | Long random string used to sign login tokens                                       |
| `PORT`                | No       | Port to run on (defaults to `3000`)                                                |
| `NODE_ENV`            | No       | Set to `production` when deployed, which turns on secure cookies and proxy support |

The server refuses to start if a required variable is missing. Never commit your real `.env` file. It is listed in `.gitignore`, and `.env.example` shows the format without real values.

## Using the admin dashboard

1. Go to `/admin.html` and log in. The login lasts 2 hours.
2. **Profile photo:** upload a JPG, PNG or WebP under 2 MB. A square photo works best.
3. **CV:** upload a PDF under 3 MB. The download buttons appear on the site automatically.
4. **Skills:** add a skill and pick a category. Use the suggested category names so that skills and projects match each other.
5. **Projects:** add a title, category, description, comma-separated tags, links and a screenshot. Leave the image empty when editing to keep the current one.
6. **Certifications:** add the course, issuer and month, plus a certificate image (or PDF) and a verification link such as Credly. An image gives a preview on the site.
7. **Messages:** read messages from the contact form and reply using the buttons on each one.

## Project structure

```
portfolio/
├── db/
│   └── database.js          # database connection and table setup
├── middleware/
│   └── auth.js              # checks the login cookie
├── routes/
│   ├── auth.js              # login, logout, login check
│   ├── certifications.js    # certifications CRUD and uploads
│   ├── contact.js           # contact form and messages
│   ├── profile.js           # profile photo and CV
│   ├── projects.js          # projects CRUD and image uploads
│   └── skills.js            # skills CRUD
├── public/
│   ├── css/style.css        # all styles
│   ├── js/
│   │   ├── main.js          # public site logic
│   │   └── admin.js         # dashboard logic
│   ├── uploads/             # uploaded files (not committed)
│   ├── index.html           # public site
│   └── admin.html           # admin dashboard
├── .env.example             # template for your environment variables
├── .gitignore
├── package.json
└── server.js                # app entry point
```

## Database

SQLite stores everything in a single file. Tables are created automatically on startup.

| Table            | Holds                                                 |
| ---------------- | ----------------------------------------------------- |
| `projects`       | title, description, tech tags, category, links, image |
| `skills`         | name, category                                        |
| `certifications` | title, issuer, month earned, verification link, file  |
| `messages`       | name, email, phone, message, date                     |
| `settings`       | profile photo and CV file names                       |

## API reference

Routes marked **Admin** need a valid login cookie and return `401` without one.

| Method   | Route                     | Access                | Purpose                         |
| -------- | ------------------------- | --------------------- | ------------------------------- |
| `POST`   | `/api/auth/login`         | Public (rate limited) | Log in                          |
| `POST`   | `/api/auth/logout`        | Public                | Log out                         |
| `GET`    | `/api/auth/check`         | Admin                 | Check if logged in              |
| `GET`    | `/api/projects`           | Public                | List projects                   |
| `POST`   | `/api/projects`           | Admin                 | Add a project                   |
| `PUT`    | `/api/projects/:id`       | Admin                 | Edit a project                  |
| `DELETE` | `/api/projects/:id`       | Admin                 | Delete a project                |
| `GET`    | `/api/skills`             | Public                | List skills                     |
| `POST`   | `/api/skills`             | Admin                 | Add a skill                     |
| `PUT`    | `/api/skills/:id`         | Admin                 | Edit a skill                    |
| `DELETE` | `/api/skills/:id`         | Admin                 | Delete a skill                  |
| `GET`    | `/api/certifications`     | Public                | List certifications             |
| `POST`   | `/api/certifications`     | Admin                 | Add a certification             |
| `PUT`    | `/api/certifications/:id` | Admin                 | Edit a certification            |
| `DELETE` | `/api/certifications/:id` | Admin                 | Delete a certification          |
| `POST`   | `/api/contact`            | Public (rate limited) | Send a message                  |
| `GET`    | `/api/contact`            | Admin                 | Read messages                   |
| `DELETE` | `/api/contact/:id`        | Admin                 | Delete a message                |
| `GET`    | `/api/profile`            | Public                | Get the photo and CV file names |
| `POST`   | `/api/profile/photo`      | Admin                 | Upload the profile photo        |
| `DELETE` | `/api/profile/photo`      | Admin                 | Remove the profile photo        |
| `POST`   | `/api/profile/cv`         | Admin                 | Upload the CV                   |
| `DELETE` | `/api/profile/cv`         | Admin                 | Remove the CV                   |

## Security

- Passwords are stored only as bcrypt hashes, and the login error message does not reveal whether the username or the password was wrong
- Login tokens live in an `httpOnly`, `sameSite=strict` cookie (and `secure` in production), so scripts in the browser cannot read them
- Every route that changes data is protected by the login check on the server, not just hidden in the interface
- All database queries are parameterized, which prevents SQL injection
- User-provided text is escaped before it is shown on a page, which prevents cross-site scripting
- Uploads are limited by type (JPG, PNG, WebP and PDF only, no SVG) and size, renamed to random file names, and PDFs are checked for a real PDF signature
- `helmet` sets security headers, including a Content Security Policy that only allows scripts from the site itself
- Rate limits: 10 login attempts per 15 minutes and 10 contact messages per hour for each visitor
- Request bodies are limited to 10 KB, and error details are logged on the server instead of shown to visitors

## Deployment

_Add this section once the site is live._ Things to note for any host:

- Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` and `NODE_ENV=production` in the host's environment settings. The `.env` file is not uploaded.
- The start command is `npm start`.
- The SQLite database (`db/portfolio.db`) and the `public/uploads/` folder live on the server's disk. Many free hosts erase local files on restart, so use a host with a persistent disk or volume for both, or the projects, messages and uploads can be lost.
- Back up the database file regularly.

## Troubleshooting

| Problem                                  | Fix                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Missing environment variables` on start | Check that `.env` exists in the project root and has all three required values                                                 |
| Admin login always fails                 | Regenerate the password hash, keep single quotes around it in `.env`, and restart the server                                   |
| `no such table` error                    | Restart the server so it can create the missing table, and check `db/database.js` has every table block above `module.exports` |
| Changes to code are not showing          | Restart the server for backend changes, and hard refresh (`Ctrl + Shift + R`) for front-end changes                            |
| Upload says "route not found"            | Check that the route is connected in `server.js`, then restart the server                                                      |
| Locked out after too many login attempts | Wait 15 minutes, or restart the server                                                                                         |

## What I learned

_Personalize this section in your own words. A few ideas to start from:_

- Building a REST API with Express and connecting it to a frontend using `fetch`
- Designing a relational database and writing safe, parameterized queries
- Authentication with hashed passwords and tokens, and protecting routes with middleware
- Handling file uploads securely
- Thinking about security from the start: validation, rate limiting and safe output
- Using Git and GitHub to track a project step by step

## Contact

- **Email:** mxxxxxxxxxxxx@gmail.com
- **GitHub:** [github.com/YOUR-GITHUB-USERNAME](https://github.com/CoderMuthara)
- **LinkedIn:** \_
- **WhatsApp:** +254 762 xxx 914

Built by Kelvin Muthara.
