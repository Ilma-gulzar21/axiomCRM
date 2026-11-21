import React from 'react';

const AlertBanner = ({ alert, onClose }) => {
  if (!alert || !alert.message) return null;

  return (
    <div
      className={`alert alert-${alert.type || 'info'} alert-dismissible fade show mb-4 shadow-sm`}
      role="alert"
    >
      <div className="d-flex align-items-center gap-2">
        <i
          className={`bi ${
            alert.type === 'danger'
              ? 'bi-exclamation-triangle-fill'
              : alert.type === 'success'
              ? 'bi-check-circle-fill'
              : 'bi-info-circle-fill'
          }`}
        ></i>
        <span>{alert.message}</span>
      </div>
      <button
        type="button"
        className="btn-close"
        onClick={onClose}
        aria-label="Close"
      ></button>
    </div>
  );
};

export default AlertBanner;
