/**
 * Global error handler ensuring no internal database details or stack traces
 * are exposed in the JSON response to the client.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Sequelize Unique Constraint error mapping
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'Field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists.`
    });
  }

  // Sequelize Validation Error mapping
  if (err.name === 'SequelizeValidationError') {
    const firstMsg = err.errors && err.errors[0] ? err.errors[0].message : 'Validation failed.';
    return res.status(400).json({
      success: false,
      message: firstMsg
    });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'An unexpected internal server error occurred.' 
    : err.message || 'Request failed.';

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
