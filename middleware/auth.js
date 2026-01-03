const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Activity = require('../models/Activity');

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if token is missing
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Check resource ownership
 * Verifies user owns the resource they're trying to modify
 */
const checkOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  const userId = req.user.id || req.user._id;
  const resourceOwnerId = req.params.userId || req.body.userId;

  if (userId !== resourceOwnerId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource.',
    });
  }

  next();
};

/**
 * Rate limiting middleware
 * Limits number of requests per time window
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for admin users
      return req.user && req.user.role === 'admin';
    },
  });
};

/**
 * Verify business owner
 * Checks if user is business owner with valid business
 */
const verifyBusinessOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'business_owner') {
    return res.status(403).json({
      success: false,
      message: 'This action is only available for business owners.',
    });
  }

  if (!req.user.businessId) {
    return res.status(403).json({
      success: false,
      message: 'No active business found. Please create a business profile first.',
    });
  }

  next();
};

/**
 * Verify admin privileges
 * Ensures user has admin role
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required.',
    });
  }

  next();
};

/**
 * Validate request data
 * Checks for required fields in request body
 */
const validateRequest = (requiredFields = []) => {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach((field) => {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

/**
 * Log activity middleware
 * Records user actions for audit trail
 */
const logActivity = async (req, res, next) => {
  // Capture original send function
  const originalSend = res.send;

  res.send = function (data) {
    // Log the activity after response
    if (req.user) {
      const activity = {
        userId: req.user.id || req.user._id,
        username: req.user.username,
        action: `${req.method} ${req.originalUrl}`,
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      // Try to save activity log (non-blocking)
      if (Activity) {
        Activity.create(activity).catch((err) => {
          console.error('Failed to log activity:', err);
        });
      }
    }

    // Call the original send
    res.send = originalSend;
    return res.send(data);
  };

  next();
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error handling middleware
 * Centralized error handling
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: err.message,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: err.message,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      error: err.message,
    });
  }

  // Cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message,
    });
  }

  // Default error
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// Export all middleware functions
module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
  createRateLimiter,
  verifyBusinessOwner,
  verifyAdmin,
  validateRequest,
  logActivity,
  asyncHandler,
  errorHandler,
};
