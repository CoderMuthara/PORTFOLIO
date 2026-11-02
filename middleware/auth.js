const jwt = require('jsonwebtoken');

// Put this in front of any route that only the admin should reach
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next(); // token is valid, continue to the route
  } catch (error) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = requireAuth;