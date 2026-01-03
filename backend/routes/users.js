const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = ''
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const users = await User.find(filter)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Return paginated response
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (User can view own profile, Admin can view any)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.user._id.toString();

    // Check authorization: user can view own profile or admin can view any
    if (authenticatedUserId !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user profile'
      });
    }

    const user = await User.findById(id).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (User can update own profile, Admin can update any)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.user._id.toString();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      bio,
      avatar,
      dateOfBirth,
      location
    } = req.body;

    // Check authorization: user can update own profile or admin can update any
    if (authenticatedUserId !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user profile'
      });
    }

    // Validate input
    if (!firstName && !lastName && !email && !phoneNumber && !bio && !avatar && !dateOfBirth && !location) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update provided'
      });
    }

    // Check if email is already in use (if being updated)
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Build update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (location) updateData.location = location;

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin only)
 */
router.patch('/:id/role', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const authenticatedUserId = req.user._id.toString();

    // Validate role input
    const validRoles = ['user', 'moderator', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Prevent admin from changing their own role
    if (authenticatedUserId === id && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const previousRole = user.role;
    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    // Remove sensitive fields from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(200).json({
      success: true,
      message: `User role changed from ${previousRole} to ${role}`,
      data: userResponse
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing user role',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only, or user can delete own account)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.user._id.toString();
    const { permanentDelete = false } = req.query;

    // Check authorization: user can delete own account or admin can delete any
    if (authenticatedUserId !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (permanentDelete === 'true') {
      // Permanent deletion (Admin only)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can permanently delete users'
        });
      }

      await User.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'User permanently deleted'
      });
    } else {
      // Soft delete: mark user as inactive
      user.status = 'inactive';
      user.deletedAt = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User account deactivated',
        data: {
          userId: user._id,
          status: user.status,
          deactivatedAt: user.deletedAt
        }
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity/stats
 * @access  Private (User can view own activity, Admin can view any)
 */
router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.user._id.toString();

    // Check authorization
    if (authenticatedUserId !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user activity'
      });
    }

    const user = await User.findById(id).select('_id firstName lastName email createdAt updatedAt lastLogin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user activity stats
    res.status(200).json({
      success: true,
      message: 'User activity retrieved successfully',
      data: {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        accountCreatedAt: user.createdAt,
        lastUpdatedAt: user.updatedAt,
        lastLoginAt: user.lastLogin,
        accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)) + ' days'
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user activity',
      error: error.message
    });
  }
});

module.exports = router;
