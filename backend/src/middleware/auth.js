const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password'); // points included automatically
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      next();
    } catch {
      return res.status(401).json({ message: 'Token invalid' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, adminOnly };
