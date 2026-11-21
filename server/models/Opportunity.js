const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Opportunity = sequelize.define('Opportunity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  opportunityName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  stage: {
    type: DataTypes.ENUM('Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'),
    allowNull: false,
    defaultValue: 'Qualification'
  },
  probability: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  expectedCloseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'Closed'),
    allowNull: false,
    defaultValue: 'Active'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'opportunities',
  timestamps: true
});

module.exports = Opportunity;
