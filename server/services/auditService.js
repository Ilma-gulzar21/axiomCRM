const { AuditLog } = require('../models');

/**
 * Creates an immutable audit log entry.
 * Errors in audit logging should not crash the main business request.
 */
const logAudit = async ({ userId, action, entityName, recordId, oldValue, newValue, req }) => {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.replace('::ffff:', '');
      }
    }

    await AuditLog.create({
      userId: userId || null,
      action,
      entityName,
      recordId: recordId || null,
      oldValue: oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null,
      newValue: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
      ipAddress,
      createdDate: new Date()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = {
  logAudit
};
