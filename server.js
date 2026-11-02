require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/projects', require('./routes/projects'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/profile', require('./routes/profile'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});