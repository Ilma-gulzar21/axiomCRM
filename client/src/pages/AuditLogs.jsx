import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import AlertBanner from '../components/AlertBanner';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityName: '',
    startDate: '',
    endDate: ''
  });

  // Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to load users for filter:', e);
    }
  };

  const fetchLogs = async (currentPage = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const res = await api.get('/audit', {
        params: {
          page: currentPage,
          limit: 15,
          userId: currentFilters.userId || undefined,
          action: currentFilters.action || undefined,
          entityName: currentFilters.entityName || undefined,
          startDate: currentFilters.startDate || undefined,
          endDate: currentFilters.endDate || undefined
        }
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to fetch audit logs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs(1, filters);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1, filters);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      userId: '',
      action: '',
      entityName: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    fetchLogs(1, emptyFilters);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'bg-success';
    if (action.includes('UPDATE')) return 'bg-primary';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'bg-danger';
    if (action.includes('LOCKOUT')) return 'bg-danger';
    if (action.includes('LOGIN_SUCCESS')) return 'bg-info text-dark';
    if (action.includes('LOGIN_FAILED')) return 'bg-warning text-dark';
    return 'bg-secondary';
  };

  const renderJsonOrText = (val) => {
    if (!val) return <span className="text-muted">None</span>;
    try {
      const parsed = JSON.parse(val);
      return (
        <pre className="bg-light p-2 rounded small mb-0" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <div className="text-break small">{val}</div>;
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">Audit Trail & Security Logs</h3>
          <p className="text-muted small mb-0">
            Immutable, append-only compliance logs for user logins, security lockouts, and CRM records
          </p>
        </div>
        <span className="badge bg-danger px-3 py-2">
          <i className="bi bi-shield-lock me-1"></i> Admin Privilege Required
        </span>
      </div>

      <AlertBanner alert={alert} onClose={() => setAlert(null)} />

      {/* Filter Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleFilterSubmit} className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label small fw-semibold text-muted mb-1">User</label>
              <select
                name="userId"
                className="form-select form-select-sm"
                value={filters.userId}
                onChange={handleFilterChange}
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Entity</label>
              <select
                name="entityName"
                className="form-select form-select-sm"
                value={filters.entityName}
                onChange={handleFilterChange}
              >
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Customer">Customer</option>
                <option value="Opportunity">Opportunity</option>
                <option value="FollowUp">FollowUp</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Action</label>
              <select
                name="action"
                className="form-select form-select-sm"
                value={filters.action}
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="ACCOUNT_LOCKOUT">ACCOUNT_LOCKOUT</option>
                <option value="CUSTOMER_CREATE">CUSTOMER_CREATE</option>
                <option value="CUSTOMER_UPDATE">CUSTOMER_UPDATE</option>
                <option value="CUSTOMER_DEACTIVATE">CUSTOMER_DEACTIVATE</option>
                <option value="OPPORTUNITY_CREATE">OPPORTUNITY_CREATE</option>
                <option value="OPPORTUNITY_UPDATE">OPPORTUNITY_UPDATE</option>
                <option value="OPPORTUNITY_DELETE">OPPORTUNITY_DELETE</option>
                <option value="FOLLOWUP_CREATE">FOLLOWUP_CREATE</option>
                <option value="FOLLOWUP_UPDATE">FOLLOWUP_UPDATE</option>
                <option value="FOLLOWUP_COMPLETE">FOLLOWUP_COMPLETE</option>
                <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
              </select>
            </div>

            <div className="col-6 col-sm-3 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="form-control form-control-sm"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-6 col-sm-3 col-md-2">
              <label className="form-label small fw-semibold text-muted mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                className="form-control form-control-sm"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-12 col-md-1 d-flex gap-1">
              <button type="submit" className="btn btn-primary btn-sm w-100" title="Apply Filters">
                <i className="bi bi-funnel"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleResetFilters}
                title="Reset Filters"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Record ID</th>
                <th>IP Address</th>
                <th className="text-end">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td><small className="text-muted">#{log.id}</small></td>
                    <td><small className="text-dark fw-medium">{formatDateTime(log.createdDate)}</small></td>
                    <td>
                      {log.user ? (
                        <div>
                          <span className="fw-semibold text-dark">{log.user.username}</span>
                          <span className="badge bg-light text-muted border ms-1">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-muted fst-italic">Anonymous / System</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td><span className="badge bg-light text-dark border">{log.entityName}</span></td>
                    <td><small className="text-muted">{log.recordId || '-'}</small></td>
                    <td><small className="text-muted font-monospace">{log.ipAddress || '-'}</small></td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setSelectedLog(log)}
                        title="View Change Payload"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
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
            onPageChange={(p) => fetchLogs(p, filters)}
          />
        </div>
      </div>

      {/* Audit Log Detail Modal */}
      {selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Audit Entry Details #{selectedLog.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLog(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-2 mb-3 pb-3 border-bottom">
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Action</small>
                    <span className={`badge ${getActionBadge(selectedLog.action)}`}>{selectedLog.action}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Entity</small>
                    <strong>{selectedLog.entityName}</strong> {selectedLog.recordId && `(#${selectedLog.recordId})`}
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Actor</small>
                    <strong>{selectedLog.user?.username || 'System'}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Timestamp</small>
                    <small>{formatDateTime(selectedLog.createdDate)}</small>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-danger">Previous State (Old Value)</label>
                    {renderJsonOrText(selectedLog.oldValue)}
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-success">New State (New Value)</label>
                    {renderJsonOrText(selectedLog.newValue)}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
