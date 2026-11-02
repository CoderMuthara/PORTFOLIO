require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies (we'll need this for the contact form)
app.use(express.json());

// Serve everything inside the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/projects', require('./routes/projects'));
app.use('/api/contact', require('./routes/contact'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});