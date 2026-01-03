const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\d\s\-\+\(\)]+$/,
        'Please provide a valid phone number'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    profileImage: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },

    // Role-based Access
    role: {
      type: String,
      enum: {
        values: ['user', 'restaurant_owner', 'umrah_manager', 'car_seller', 'store_owner', 'moderator', 'admin'],
        message: 'Please select a valid role'
      },
      default: 'user'
    },

    // Status Management
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended', 'deleted'],
        message: 'Invalid status'
      },
      default: 'active'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },

    // Business Information
    businessInfo: {
      businessName: {
        type: String,
        trim: true
      },
      businessType: {
        type: String,
        enum: ['restaurant', 'umrah_service', 'car_rental', 'store', 'other'],
        default: null
      },
      businessRegistration: {
        type: String
      },
      businessLicense: {
        type: String
      },
      businessDescription: {
        type: String,
        maxlength: [1000, 'Business description cannot exceed 1000 characters']
      },
      businessPhone: {
        type: String,
        match: [
          /^[\d\s\-\+\(\)]+$/,
          'Please provide a valid business phone number'
        ]
      },
      businessEmail: {
        type: String,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please provide a valid business email'
        ]
      },
      businessAddress: {
        street: String,
        city: String,
        country: String,
        postalCode: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      businessWebsite: {
        type: String,
        match: [
          /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)$/,
          'Please provide a valid website URL'
        ]
      },
      businessRating: {
        type: Number,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
      },
      businessVerified: {
        type: Boolean,
        default: false
      },
      verificationDocuments: [{
        documentType: String,
        documentUrl: String,
        uploadedAt: Date
      }]
    },

    // Account Security
    passwordChangedAt: Date,
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    lastLoginAt: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,

    // Activity Tracking
    activityLog: [{
      action: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      ipAddress: String,
      userAgent: String,
      details: mongoose.Schema.Types.Mixed
    }],

    // Notification Preferences
    notificationPreferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      marketingEmails: {
        type: Boolean,
        default: false
      }
    },

    // Account Metadata
    isActive: {
      type: Boolean,
      default: true
    },
    role_permissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission'
    }],
    deletedAt: Date,

    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'businessInfo.businessName': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// ==================== MIDDLEWARE ====================

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update passwordChangedAt for password changes
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Compare provided password with hashed password
 * @param {String} enteredPassword - Password entered by user
 * @returns {Promise<Boolean>}
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT Token
 * @returns {String} JWT token
 */
userSchema.methods.getSignedJwt = function() {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Generate password reset token
 * @returns {String} Reset token
 */
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');

  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  return resetToken;
};

/**
 * Generate email verification token
 * @returns {String} Verification token
 */
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');

  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return verificationToken;
};

/**
 * Check if password reset token is expired
 * @returns {Boolean}
 */
userSchema.methods.isResetTokenExpired = function() {
  return Date.now() > this.passwordResetExpires;
};

/**
 * Check if user is locked due to failed login attempts
 * @returns {Boolean}
 */
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Increment login attempts
 */
userSchema.methods.incLoginAttempts = async function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Increment attempts and set lock if max attempts exceeded
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Check if user can perform action (not deleted, active status)
 * @returns {Boolean}
 */
userSchema.methods.canPerformAction = function() {
  return this.status === 'active' && !this.deletedAt && this.isActive;
};

/**
 * Add activity log entry
 * @param {Object} activity - Activity object
 */
userSchema.methods.addActivityLog = function(activity) {
  this.activityLog.push({
    action: activity.action,
    timestamp: new Date(),
    ipAddress: activity.ipAddress || null,
    userAgent: activity.userAgent || null,
    details: activity.details || {}
  });

  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }

  return this.save();
};

/**
 * Soft delete user account
 */
userSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

/**
 * Restore deleted user account
 */
userSchema.methods.restore = async function() {
  this.status = 'active';
  this.deletedAt = null;
  this.isActive = true;
  return this.save();
};

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = async function(ipAddress, userAgent) {
  this.lastLoginAt = new Date();
  await this.addActivityLog({
    action: 'LOGIN',
    ipAddress,
    userAgent
  });
  return this.save();
};

/**
 * Check if user has specific role
 * @param {String|Array} roles - Role(s) to check
 * @returns {Boolean}
 */
userSchema.methods.hasRole = function(roles) {
  if (typeof roles === 'string') {
    return this.role === roles;
  }
  return roles.includes(this.role);
};

/**
 * Check if user is business owner
 * @returns {Boolean}
 */
userSchema.methods.isBusinessOwner = function() {
  const businessRoles = ['restaurant_owner', 'umrah_manager', 'car_seller', 'store_owner'];
  return businessRoles.includes(this.role);
};

/**
 * Get user profile (excluding sensitive data)
 * @returns {Object}
 */
userSchema.methods.getProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  return user;
};

/**
 * Update user profile
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
userSchema.methods.updateProfile = async function(updates) {
  const allowedFields = [
    'firstName',
    'lastName',
    'phone',
    'profileImage',
    'bio',
    'notificationPreferences'
  ];

  const allowedUpdates = Object.keys(updates).filter(key =>
    allowedFields.includes(key)
  );

  allowedUpdates.forEach(field => {
    this[field] = updates[field];
  });

  return this.save();
};

/**
 * Update business information
 * @param {Object} businessData - Business information to update
 * @returns {Promise<Object>}
 */
userSchema.methods.updateBusinessInfo = async function(businessData) {
  if (!this.isBusinessOwner()) {
    throw new Error('Only business owners can update business information');
  }

  const allowedFields = [
    'businessName',
    'businessType',
    'businessRegistration',
    'businessLicense',
    'businessDescription',
    'businessPhone',
    'businessEmail',
    'businessAddress',
    'businessWebsite'
  ];

  Object.keys(businessData).forEach(key => {
    if (allowedFields.includes(key)) {
      this.businessInfo[key] = businessData[key];
    }
  });

  return this.save();
};

// ==================== STATIC METHODS ====================

/**
 * Find user by credentials
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<Object>}
 */
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!await user.matchPassword(password)) {
    throw new Error('Invalid email or password');
  }

  return user;
};

/**
 * Find by role
 * @param {String|Array} roles - Role(s) to search
 * @returns {Promise<Array>}
 */
userSchema.statics.findByRole = function(roles) {
  if (typeof roles === 'string') {
    return this.find({ role: roles, status: 'active' });
  }
  return this.find({ role: { $in: roles }, status: 'active' });
};

/**
 * Search users
 * @param {String} searchTerm - Search keyword
 * @param {Object} options - Search options
 * @returns {Promise<Array>}
 */
userSchema.statics.searchUsers = function(searchTerm, options = {}) {
  const query = {
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { 'businessInfo.businessName': { $regex: searchTerm, $options: 'i' } }
    ],
    status: options.status || 'active'
  };

  if (options.role) {
    query.role = options.role;
  }

  return this.find(query)
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

/**
 * Get user statistics
 * @returns {Promise<Object>}
 */
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        totalUsers: [{ $count: 'count' }],
        activeUsers: [
          { $match: { status: 'active' } },
          { $count: 'count' }
        ],
        usersByRole: [
          { $group: { _id: '$role', count: { $count: {} } } }
        ],
        verifiedUsers: [
          { $match: { isEmailVerified: true } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    total: stats[0].totalUsers[0]?.count || 0,
    active: stats[0].activeUsers[0]?.count || 0,
    byRole: stats[0].usersByRole,
    verified: stats[0].verifiedUsers[0]?.count || 0
  };
};

/**
 * Deactivate user
 * @param {String} userId - User ID
 * @returns {Promise<Object>}
 */
userSchema.statics.deactivateUser = function(userId) {
  return this.findByIdAndUpdate(
    userId,
    { status: 'inactive', isActive: false },
    { new: true }
  );
};

/**
 * Suspend user
 * @param {String} userId - User ID
 * @param {String} reason - Suspension reason
 * @returns {Promise<Object>}
 */
userSchema.statics.suspendUser = function(userId, reason) {
  return this.findByIdAndUpdate(
    userId,
    {
      status: 'suspended',
      activityLog: {
        action: 'SUSPENDED',
        timestamp: new Date(),
        details: { reason }
      }
    },
    { new: true }
  );
};

module.exports = mongoose.model('User', userSchema);
