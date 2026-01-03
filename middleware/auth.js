const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bsu-chat-jwt-secret-2024';

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tapılmadı' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token etibarsızdır' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.adminToken || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin token tapılmadı' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin icazəsi yoxdur' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token etibarsızdır' });
  }
};

module.exports = { authenticateToken, authenticateAdmin, JWT_SECRET };
