const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware для аутентификации пользователя
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.user_id);
    
    if (!user || !user.is_active) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Требуется аутентификация'
    });
  }
};

/**
 * Middleware для проверки ролей пользователя
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Требуется аутентификация'
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.user_id);
      if (!user || !user.is_active) {
        return next();
      }
      req.user = user;
      req.token = token;
      next();
    } catch (_) {
      next();
    }
  }
};
