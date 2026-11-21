const sequelize = require('../config/db');
const User = require('./User');
const Customer = require('./Customer');
const Opportunity = require('./Opportunity');
const FollowUp = require('./FollowUp');
const AuditLog = require('./AuditLog');

// Customer Associations
User.hasMany(Customer, { foreignKey: 'createdBy', as: 'createdCustomers' });
Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Opportunity Associations
Customer.hasMany(Opportunity, { foreignKey: 'customerId', as: 'opportunities' });
Opportunity.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Opportunity, { foreignKey: 'assignedTo', as: 'assignedOpportunities' });
Opportunity.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Opportunity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// FollowUp Associations
Customer.hasMany(FollowUp, { foreignKey: 'customerId', as: 'followUps' });
FollowUp.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(FollowUp, { foreignKey: 'assignedTo', as: 'assignedFollowUps' });
FollowUp.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
FollowUp.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// AuditLog Associations
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Customer,
  Opportunity,
  FollowUp,
  AuditLog
};
