const { Op } = require('sequelize');
const { FollowUp, Customer, User } = require('../models');
const { getScopeFilter } = require('../middleware/authorize');
const { logAudit } = require('../services/auditService');

/**
 * Get follow-ups with filter and pagination (scoped by role)
 */
const getFollowUps = async (req, res, next) => {
  try {
    const { status, type, customerId, pendingOnly, page = 1, limit = 10 } = req.query;
    const scopeFilter = getScopeFilter(req.user, 'followup');

    const where = {
      ...scopeFilter
    };

    if (status) {
      where.status = status;
    }

    if (pendingOnly === 'true') {
      where.status = 'Planned';
    }

    if (type) {
      where.followUpType = type;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await FollowUp.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName', 'phone', 'email', 'companyName']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [
        ['followUpDate', 'ASC'],
        ['id', 'DESC']
      ],
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

/**
 * Get follow-up by ID
 */
const getFollowUpById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'followup');

    const followUp = await FollowUp.findOne({
      where: { id, ...scopeFilter },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName', 'phone', 'email', 'companyName']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      data: followUp
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule / Create Follow-up
 */
const createFollowUp = async (req, res, next) => {
  try {
    const { customerId, followUpDate, followUpType, remarks, status, assignedTo } = req.body;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Associated customer does not exist.'
      });
    }

    let targetAssignee = req.user.id;
    if (assignedTo && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
      const assigneeUser = await User.findByPk(assignedTo);
      if (assigneeUser) {
        targetAssignee = assigneeUser.id;
      }
    }

    const newFollowUp = await FollowUp.create({
      customerId,
      followUpDate,
      followUpType: followUpType || 'Call',
      remarks: remarks ? remarks.trim() : null,
      status: status || 'Planned',
      assignedTo: targetAssignee,
      createdBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'FOLLOWUP_CREATE',
      entityName: 'FollowUp',
      recordId: newFollowUp.id,
      newValue: newFollowUp.toJSON(),
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Follow-up scheduled successfully.',
      data: newFollowUp
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update / Edit Follow-up
 */
const updateFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'followup');

    const followUp = await FollowUp.findOne({
      where: { id, ...scopeFilter }
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or access denied.'
      });
    }

    const { customerId, followUpDate, followUpType, remarks, status, assignedTo } = req.body;
    const oldValue = followUp.toJSON();

    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Associated customer does not exist.' });
      }
      followUp.customerId = customerId;
    }

    if (followUpDate) followUp.followUpDate = followUpDate;
    if (followUpType) followUp.followUpType = followUpType;
    if (remarks !== undefined) followUp.remarks = remarks ? remarks.trim() : null;
    if (status) followUp.status = status;
    if (assignedTo && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
      followUp.assignedTo = assignedTo;
    }

    await followUp.save();

    await logAudit({
      userId: req.user.id,
      action: 'FOLLOWUP_UPDATE',
      entityName: 'FollowUp',
      recordId: followUp.id,
      oldValue,
      newValue: followUp.toJSON(),
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully.',
      data: followUp
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Follow-up as Completed
 */
const completeFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const scopeFilter = getScopeFilter(req.user, 'followup');

    const followUp = await FollowUp.findOne({
      where: { id, ...scopeFilter }
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or access denied.'
      });
    }

    const oldValue = followUp.toJSON();
    followUp.status = 'Completed';
    if (remarks) {
      followUp.remarks = (followUp.remarks ? followUp.remarks + ' | ' : '') + `Completed: ${remarks.trim()}`;
    }

    await followUp.save();

    await logAudit({
      userId: req.user.id,
      action: 'FOLLOWUP_COMPLETE',
      entityName: 'FollowUp',
      recordId: followUp.id,
      oldValue,
      newValue: followUp.toJSON(),
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as Completed.',
      data: followUp
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Follow-up
 */
const deleteFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'followup');

    const followUp = await FollowUp.findOne({
      where: { id, ...scopeFilter }
    });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or access denied.'
      });
    }

    const oldValue = followUp.toJSON();
    await followUp.destroy();

    await logAudit({
      userId: req.user.id,
      action: 'FOLLOWUP_DELETE',
      entityName: 'FollowUp',
      recordId: id,
      oldValue,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp
};
