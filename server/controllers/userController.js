const { User } = require('../models');
const { logAudit } = require('../services/auditService');

/**
 * List all users with lockout status (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'email',
        'role',
        'isActive',
        'failedLoginCount',
        'lockoutEnd',
        'createdAt',
        'updatedAt'
      ],
      order: [['id', 'ASC']]
    });

    const now = new Date();
    const formatted = users.map(user => {
      const u = user.toJSON();
      u.isLocked = !!(u.lockoutEnd && now < new Date(u.lockoutEnd));
      return u;
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change User Role (Admin only) - Audited
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Manager', 'SalesExecutive'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required (Admin, Manager, SalesExecutive).'
      });
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAudit({
      userId: req.user.id,
      action: 'USER_ROLE_CHANGE',
      entityName: 'User',
      recordId: targetUser.id,
      oldValue: { role: previousRole },
      newValue: { role: targetUser.role },
      req
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate or Deactivate User (Admin only)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent Admin from deactivating themselves
    if (parseInt(id, 10) === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.'
      });
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const previousStatus = targetUser.isActive;
    targetUser.isActive = Boolean(isActive);
    await targetUser.save();

    await logAudit({
      userId: req.user.id,
      action: targetUser.isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      entityName: 'User',
      recordId: targetUser.id,
      oldValue: { isActive: previousStatus },
      newValue: { isActive: targetUser.isActive },
      req
    });

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: {
        id: targetUser.id,
        username: targetUser.username,
        isActive: targetUser.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlock Locked User Account (Admin only)
 */
const unlockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    targetUser.failedLoginCount = 0;
    targetUser.lockoutEnd = null;
    await targetUser.save();

    await logAudit({
      userId: req.user.id,
      action: 'USER_UNLOCK',
      entityName: 'User',
      recordId: targetUser.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: `User account for ${targetUser.username} has been unlocked.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  unlockUser
};
