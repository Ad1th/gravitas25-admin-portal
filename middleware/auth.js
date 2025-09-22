const jwt = require('jsonwebtoken');

// Middleware to protect admin routes
module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    if (!user.is_admin) return res.status(403).json({ message: 'Admins only' });
    req.user = user;
    next();
  });
};

