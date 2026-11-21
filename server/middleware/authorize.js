const { Op } = require('sequelize');

/**
 * Middleware to restrict access based on user role(s).
 * @param {string[]} allowedRoles - Array of allowed roles: ['Admin', 'Manager', 'SalesExecutive']
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions for this action.'
      });
    }

    next();
  };
};

/**
 * Returns a Sequelize where clause scoped to the current user's role.
 * - Admin & Manager: See all records (where = {})
 * - SalesExecutive: Records assigned to or created by them
 */
const getScopeFilter = (user, entityType = 'general') => {
  if (!user || user.role === 'Admin' || user.role === 'Manager') {
    return {};
  }

  // SalesExecutive
  if (entityType === 'customer') {
    // Customers have createdBy
    return { createdBy: user.id };
  }

  // Opportunities and FollowUps have both assignedTo and createdBy
  return {
    [Op.or]: [
      { assignedTo: user.id },
      { createdBy: user.id }
    ]
  };
};

module.exports = {
  requireRole,
  getScopeFilter
};
