const jwt = require('jsonwebtoken');
const supabase = require('../src/config/supabase');

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid auth header' });

    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and is admin
    const { data: user, error } = await supabase
      .from('User')
      .select('id, role, email')
      .eq('id', payload.id)
      .single();

    if (error || !user) return res.status(401).json({ message: 'Invalid token user' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

    // attach user object
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    console.error('requireAdmin error:', err.message || err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
