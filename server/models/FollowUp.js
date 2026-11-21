const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FollowUp = sequelize.define('FollowUp', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  followUpType: {
    type: DataTypes.ENUM('Call', 'Email', 'Meeting', 'Demo'),
    allowNull: false,
    defaultValue: 'Call'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Planned', 'Completed', 'Missed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Planned'
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
  tableName: 'follow_ups',
  timestamps: true
});

module.exports = FollowUp;
