const { Op } = require('sequelize');
const { Customer, User } = require('../models');
const { getScopeFilter } = require('../middleware/authorize');
const { logAudit } = require('../services/auditService');

/**
 * Generate next unique CustomerCode (e.g. CUST-1001)
 */
const generateCustomerCode = async () => {
  const lastCustomer = await Customer.findOne({
    order: [['id', 'DESC']]
  });
  const nextId = lastCustomer ? lastCustomer.id + 1 : 1;
  return `CUST-${1000 + nextId}`;
};

/**
 * Get all customers with search and pagination (scoped by role)
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const scopeFilter = getScopeFilter(req.user, 'customer');

    const where = {
      ...scopeFilter
    };

    if (status) {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { customerName: { [Op.like]: q } },
            { email: { [Op.like]: q } },
            { phone: { [Op.like]: q } },
            { companyName: { [Op.like]: q } },
            { customerCode: { [Op.like]: q } }
          ]
        }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
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
 * Get single customer by ID (scoped by role)
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'customer');

    const customer = await Customer.findOne({
      where: {
        id,
        ...scopeFilter
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Customer
 */
const createCustomer = async (req, res, next) => {
  try {
    const { customerName, email, phone, companyName, address, city, state, status } = req.body;

    // Check duplicate email
    const existingEmail = await Customer.findOne({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this email address already exists.'
      });
    }

    // Check duplicate phone
    const existingPhone = await Customer.findOne({
      where: { phone: phone.trim() }
    });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this phone number already exists.'
      });
    }

    const customerCode = await generateCustomerCode();

    const newCustomer = await Customer.create({
      customerCode,
      customerName: customerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      companyName: companyName ? companyName.trim() : null,
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      status: status || 'Active',
      createdDate: new Date(),
      createdBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'CUSTOMER_CREATE',
      entityName: 'Customer',
      recordId: newCustomer.id,
      newValue: newCustomer.toJSON(),
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: newCustomer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Customer (scoped by role)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, email, phone, companyName, address, city, state, status } = req.body;
    const scopeFilter = getScopeFilter(req.user, 'customer');

    const customer = await Customer.findOne({
      where: { id, ...scopeFilter }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied.'
      });
    }

    // Check duplicate email for other customer
    if (email && email.toLowerCase().trim() !== customer.email.toLowerCase()) {
      const existingEmail = await Customer.findOne({
        where: {
          email: email.toLowerCase().trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Another customer with this email address already exists.'
        });
      }
    }

    // Check duplicate phone for other customer
    if (phone && phone.trim() !== customer.phone) {
      const existingPhone = await Customer.findOne({
        where: {
          phone: phone.trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Another customer with this phone number already exists.'
        });
      }
    }

    const oldValue = customer.toJSON();

    if (customerName) customer.customerName = customerName.trim();
    if (email) customer.email = email.toLowerCase().trim();
    if (phone) customer.phone = phone.trim();
    if (companyName !== undefined) customer.companyName = companyName ? companyName.trim() : null;
    if (address !== undefined) customer.address = address ? address.trim() : null;
    if (city !== undefined) customer.city = city ? city.trim() : null;
    if (state !== undefined) customer.state = state ? state.trim() : null;
    if (status) customer.status = status;

    await customer.save();

    await logAudit({
      userId: req.user.id,
      action: 'CUSTOMER_UPDATE',
      entityName: 'Customer',
      recordId: customer.id,
      oldValue,
      newValue: customer.toJSON(),
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Customer = Deactivate (Sets status to 'Inactive')
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scopeFilter = getScopeFilter(req.user, 'customer');

    const customer = await Customer.findOne({
      where: { id, ...scopeFilter }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied.'
      });
    }

    const oldValue = customer.toJSON();
    customer.status = 'Inactive';
    await customer.save();

    await logAudit({
      userId: req.user.id,
      action: 'CUSTOMER_DEACTIVATE',
      entityName: 'Customer',
      recordId: customer.id,
      oldValue,
      newValue: customer.toJSON(),
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
