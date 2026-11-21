import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import AlertBanner from '../components/AlertBanner';

const FollowUps = () => {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    followUpDate: '',
    followUpType: 'Call',
    remarks: '',
    status: 'Planned'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Complete modal
  const [completingTarget, setCompletingTarget] = useState(null);
  const [completionRemark, setCompletionRemark] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchFollowUps = async (currentPage = 1, status = statusFilter, type = typeFilter) => {
    try {
      setLoading(true);
      const res = await api.get('/followups', {
        params: {
          page: currentPage,
          limit: 10,
          status: status || undefined,
          type: type || undefined
        }
      });
      if (res.data.success) {
        setFollowUps(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to fetch follow-ups.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers?limit=100&status=Active');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to load customers:', e);
    }
  };

  useEffect(() => {
    fetchFollowUps(1, statusFilter, typeFilter);
    fetchCustomersList();
  }, [statusFilter, typeFilter]);

  const validateForm = () => {
    const errors = {};

    if (!formData.customerId) {
      errors.customerId = 'Customer is required.';
    }

    if (!formData.followUpDate) {
      errors.followUpDate = 'Follow-up date is required.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      if (formData.followUpDate < todayStr) {
        errors.followUpDate = 'Follow-up date cannot be earlier than today.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openScheduleModal = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split('T')[0];

    setFormData({
      customerId: customers.length > 0 ? customers[0].id : '',
      followUpDate: tomorrowStr,
      followUpType: 'Call',
      remarks: '',
      status: 'Planned'
    });
    setFieldErrors({});
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await api.post('/followups', formData);
      setAlert({ type: 'success', message: 'Follow-up scheduled successfully.' });
      setIsScheduleModalOpen(false);
      fetchFollowUps(page, statusFilter, typeFilter);
    } catch (err) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const errors = {};
        err.fieldErrors.forEach((fe) => {
          errors[fe.field] = fe.message;
        });
        setFieldErrors(errors);
      } else {
        setAlert({ type: 'danger', message: err.cleanMessage || 'Scheduling failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingTarget) return;

    try {
      setSubmitting(true);
      await api.put(`/followups/${completingTarget.id}/complete`, {
        remarks: completionRemark
      });
      setAlert({ type: 'success', message: 'Follow-up marked as Completed.' });
      setCompletingTarget(null);
      setCompletionRemark('');
      fetchFollowUps(page, statusFilter, typeFilter);
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to complete follow-up.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/followups/${deleteTarget.id}`);
      setAlert({ type: 'success', message: 'Follow-up deleted successfully.' });
      setDeleteTarget(null);
      fetchFollowUps(page, statusFilter, typeFilter);
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Delete failed.' });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call':
        return 'bi-telephone-fill text-primary';
      case 'Email':
        return 'bi-envelope-fill text-warning';
      case 'Meeting':
        return 'bi-people-fill text-success';
      case 'Demo':
        return 'bi-display text-info';
      default:
        return 'bi-calendar-event';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Planned':
        return 'bg-primary';
      case 'Completed':
        return 'bg-success';
      case 'Missed':
        return 'bg-danger';
      case 'Cancelled':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">Customer Follow-Ups</h3>
          <p className="text-muted small mb-0">
            {user?.role === 'SalesExecutive'
              ? 'Your scheduled client engagements and communications'
              : 'Managing organizational touchpoints and meetings'}
          </p>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={openScheduleModal}>
          <i className="bi bi-calendar-plus"></i>
          <span>Schedule Follow-Up</span>
        </button>
      </div>

      <AlertBanner alert={alert} onClose={() => setAlert(null)} />

      {/* Filter Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex flex-wrap gap-1">
              {[
                { label: 'All Follow-Ups', val: '' },
                { label: 'Planned / Pending', val: 'Planned' },
                { label: 'Completed', val: 'Completed' },
                { label: 'Missed', val: 'Missed' },
                { label: 'Cancelled', val: 'Cancelled' }
              ].map((t) => (
                <button
                  key={t.val || 'all'}
                  type="button"
                  className={`btn btn-sm ${statusFilter === t.val ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter(t.val)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ width: '180px' }}>
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Demo">Demo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-Ups Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Remarks & Notes</th>
                <th>Assigned To</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading follow-ups...
                  </td>
                </tr>
              ) : followUps.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No follow-ups found matching your selection.
                  </td>
                </tr>
              ) : (
                followUps.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-semibold text-dark">{item.customer?.customerName || 'N/A'}</div>
                      <small className="text-muted">{item.customer?.phone} • {item.customer?.companyName}</small>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <i className={`bi ${getTypeIcon(item.followUpType)}`}></i>
                        <span>{item.followUpType}</span>
                      </div>
                    </td>
                    <td className="fw-medium text-dark">{item.followUpDate}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <small className="text-secondary" style={{ maxWidth: '300px', display: 'inline-block' }}>
                        {item.remarks || '-'}
                      </small>
                    </td>
                    <td><small className="text-muted">{item.assignee?.username || 'Unassigned'}</small></td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {item.status === 'Planned' && (
                          <button
                            className="btn btn-success"
                            title="Complete Follow-Up"
                            onClick={() => {
                              setCompletingTarget(item);
                              setCompletionRemark('');
                            }}
                          >
                            <i className="bi bi-check-lg me-1"></i>
                            Complete
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger"
                          title="Delete Follow-Up"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={(p) => fetchFollowUps(p, statusFilter, typeFilter)}
          />
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Schedule Customer Follow-Up</h5>
                <button type="button" className="btn-close" onClick={() => setIsScheduleModalOpen(false)}></button>
              </div>
              <form onSubmit={handleScheduleSubmit} noValidate>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Customer *</label>
                    <select
                      className={`form-select ${fieldErrors.customerId ? 'is-invalid' : ''}`}
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customerName} ({c.customerCode})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.customerId && (
                      <div className="invalid-feedback">{fieldErrors.customerId}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Follow-Up Date *</label>
                    <input
                      type="date"
                      className={`form-control ${fieldErrors.followUpDate ? 'is-invalid' : ''}`}
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    />
                    {fieldErrors.followUpDate && (
                      <div className="invalid-feedback">{fieldErrors.followUpDate}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Follow-Up Type</label>
                    <select
                      className="form-select"
                      value={formData.followUpType}
                      onChange={(e) => setFormData({ ...formData, followUpType: e.target.value })}
                    >
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Demo">Demo</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Notes / Remarks</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="e.g. Discuss contract pricing proposal"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsScheduleModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completingTarget && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Complete Follow-Up</h5>
                <button type="button" className="btn-close" onClick={() => setCompletingTarget(null)}></button>
              </div>
              <form onSubmit={handleCompleteSubmit}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Customer: <strong>{completingTarget.customer?.customerName}</strong> ({completingTarget.followUpType} on {completingTarget.followUpDate})
                  </p>
                  <label className="form-label small fw-semibold">Outcome / Completion Notes (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="e.g. Call went great, agreed to send proposal by Monday."
                    value={completionRemark}
                    onChange={(e) => setCompletionRemark(e.target.value)}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCompletingTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm" disabled={submitting}>
                    {submitting ? 'Completing...' : 'Mark as Completed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Follow-Up"
        message="Are you sure you want to remove this follow-up entry? This action will be recorded in the audit log."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FollowUps;
