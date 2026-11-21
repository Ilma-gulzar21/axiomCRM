const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');

/**
 * Get Audit Logs with filters (Admin only)
 * Filters: userId, action, entityName, startDate, endDate
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { userId, action, entityName, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityName) {
      where.entityName = entityName;
    }

    if (startDate || endDate) {
      where.createdDate = {};
      if (startDate) {
        where.createdDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        // Include until end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdDate[Op.lte] = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role']
        }
      ],
      order: [['id', 'DESC']],
      limit: pageSize,
      offset
    });

    return res.status(200).json({
      success: true,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / pageSize),
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
