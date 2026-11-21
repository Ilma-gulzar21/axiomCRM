const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entityName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  recordId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  oldValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: false
});

module.exports = AuditLog;
