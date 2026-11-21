const { Op } = require('sequelize');
const { Opportunity, Customer, User } = require('../models');
const { getScopeFilter } = require('../middleware/authorize');
const { logAudit } = require('../services/auditService');

/**
 * Get opportunities with filtering and pagination (scoped by role)
 */
const getOpportunities = async (req, res, next) => {
  try {
    const { stage, status, customerId, page = 1, limit = 10, search } = req.query;
    const scopeFilter = getScopeFilter(req.user, 'opportunity');

    const where = {
      ...scopeFilter
    };

    if (stage) {
      where.stage = stage;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search && search.trim() !== '') {
      where.opportunityName = { [Op.like]: `%${search.trim()}%` };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await Opportunity.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName', 'companyName']
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

/**
 * Get opportunity by ID (scoped by role)
 */
const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'opportunity');

    const opportunity = await Opportunity.findOne({
      where: { id, ...scopeFilter },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName', 'companyName']
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
      ]
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Opportunity
 */
const createOpportunity = async (req, res, next) => {
  try {
    const {
      opportunityName,
      customerId,
      amount,
      stage,
      probability,
      expectedCloseDate,
      status,
      assignedTo
    } = req.body;

    // Verify Customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Associated customer does not exist.'
      });
    }

    // Default assignee to creator if not specified or role restricted
    let targetAssignee = req.user.id;
    if (assignedTo && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
      const assigneeUser = await User.findByPk(assignedTo);
      if (assigneeUser) {
        targetAssignee = assigneeUser.id;
      }
    }

    const newOpportunity = await Opportunity.create({
      opportunityName: opportunityName.trim(),
      customerId,
      amount: parseFloat(amount),
      stage: stage || 'Qualification',
      probability: probability !== undefined ? parseInt(probability, 10) : 10,
      expectedCloseDate,
      status: status || 'Active',
      assignedTo: targetAssignee,
      createdBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'OPPORTUNITY_CREATE',
      entityName: 'Opportunity',
      recordId: newOpportunity.id,
      newValue: newOpportunity.toJSON(),
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Opportunity created successfully.',
      data: newOpportunity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Opportunity
 */
const updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'opportunity');

    const opportunity = await Opportunity.findOne({
      where: { id, ...scopeFilter }
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or access denied.'
      });
    }

    const {
      opportunityName,
      customerId,
      amount,
      stage,
      probability,
      expectedCloseDate,
      status,
      assignedTo
    } = req.body;

    const oldValue = opportunity.toJSON();

    if (opportunityName) opportunity.opportunityName = opportunityName.trim();
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Associated customer does not exist.' });
      }
      opportunity.customerId = customerId;
    }
    if (amount !== undefined) opportunity.amount = parseFloat(amount);
    if (stage) {
      opportunity.stage = stage;
      // If won or lost, mark status closed automatically or allow status update
      if (stage === 'Won' || stage === 'Lost') {
        opportunity.status = 'Closed';
      }
    }
    if (probability !== undefined) opportunity.probability = parseInt(probability, 10);
    if (expectedCloseDate) opportunity.expectedCloseDate = expectedCloseDate;
    if (status) opportunity.status = status;
    if (assignedTo && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
      opportunity.assignedTo = assignedTo;
    }

    await opportunity.save();

    await logAudit({
      userId: req.user.id,
      action: 'OPPORTUNITY_UPDATE',
      entityName: 'Opportunity',
      recordId: opportunity.id,
      oldValue,
      newValue: opportunity.toJSON(),
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully.',
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Opportunity
 */
const deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'opportunity');

    const opportunity = await Opportunity.findOne({
      where: { id, ...scopeFilter }
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or access denied.'
      });
    }

    const oldValue = opportunity.toJSON();
    await opportunity.destroy();

    await logAudit({
      userId: req.user.id,
      action: 'OPPORTUNITY_DELETE',
      entityName: 'Opportunity',
      recordId: id,
      oldValue,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
