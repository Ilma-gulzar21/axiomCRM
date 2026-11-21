import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import AlertBanner from '../components/AlertBanner';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Role change modal
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [newRole, setNewRole] = useState('SalesExecutive');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Status toggle modal
  const [statusTarget, setStatusTarget] = useState(null);

  // Unlock modal
  const [unlockTarget, setUnlockTarget] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to fetch user list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleChangeTarget) return;

    try {
      setSubmittingRole(true);
      await api.put(`/users/${roleChangeTarget.id}/role`, { role: newRole });
      setAlert({
        type: 'success',
        message: `Updated ${roleChangeTarget.username}'s role to ${newRole}. This action was logged to Audit.`
      });
      setRoleChangeTarget(null);
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to update user role.' });
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleStatusToggleConfirm = async () => {
    if (!statusTarget) return;
    try {
      const nextStatus = !statusTarget.isActive;
      await api.put(`/users/${statusTarget.id}/status`, { isActive: nextStatus });
      setAlert({
        type: 'success',
        message: `User ${statusTarget.username} has been ${nextStatus ? 'activated' : 'deactivated'}.`
      });
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to update user status.' });
    }
  };

  const handleUnlockConfirm = async () => {
    if (!unlockTarget) return;
    try {
      await api.put(`/users/${unlockTarget.id}/unlock`);
      setAlert({
        type: 'success',
        message: `User ${unlockTarget.username} has been unlocked.`
      });
      setUnlockTarget(null);
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to unlock user.' });
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-danger';
      case 'Manager':
        return 'bg-primary';
      case 'SalesExecutive':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">User Management & Role Permissions</h3>
          <p className="text-muted small mb-0">
            Control employee access levels, toggle accounts, and monitor security lockout status
          </p>
        </div>
        <span className="badge bg-danger px-3 py-2">
          <i className="bi bi-shield-lock me-1"></i> Admin Privileges
        </span>
      </div>

      <AlertBanner alert={alert} onClose={() => setAlert(null)} />

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Security & Lockout</th>
                <th>Failed Logins</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-light border p-2 text-primary">
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <div>
                          <span className="fw-bold text-dark">{u.username}</span>
                          {u.id === currentUser?.id && (
                            <span className="badge bg-info text-dark ms-2">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      {u.isLocked ? (
                        <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                          <i className="bi bi-lock-fill"></i> Locked Out
                        </span>
                      ) : (
                        <span className="badge bg-light text-success border">
                          <i className="bi bi-shield-check me-1"></i> Normal
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`fw-semibold ${u.failedLoginCount >= 3 ? 'text-danger' : 'text-muted'}`}>
                        {u.failedLoginCount} / 5
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Change Role"
                          onClick={() => {
                            setRoleChangeTarget(u);
                            setNewRole(u.role);
                          }}
                        >
                          <i className="bi bi-person-gear me-1"></i>
                          Role
                        </button>

                        {u.id !== currentUser?.id && (
                          <button
                            className={`btn ${u.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                            onClick={() => setStatusTarget(u)}
                          >
                            <i className={`bi ${u.isActive ? 'bi-toggle-on' : 'bi-toggle-off'} me-1`}></i>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}

                        {u.isLocked && (
                          <button
                            className="btn btn-warning"
                            title="Unlock Account"
                            onClick={() => setUnlockTarget(u)}
                          >
                            <i className="bi bi-unlock-fill me-1"></i>
                            Unlock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {roleChangeTarget && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Change Role: {roleChangeTarget.username}</h5>
                <button type="button" className="btn-close" onClick={() => setRoleChangeTarget(null)}></button>
              </div>
              <form onSubmit={handleRoleSubmit}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Current Role: <strong>{roleChangeTarget.role}</strong>. Changing this role will adjust user data scope and access rights immediately.
                  </p>
                  <label className="form-label small fw-semibold">New Role *</label>
                  <select
                    className="form-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="SalesExecutive">SalesExecutive (Scoped to assigned deals)</option>
                    <option value="Manager">Manager (Full CRM Pipeline Access)</option>
                    <option value="Admin">Admin (Full System & Audit Access)</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRoleChangeTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingRole}>
                    {submittingRole ? 'Saving...' : 'Update Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Status Modal */}
      <ConfirmModal
        isOpen={!!statusTarget}
        title={`${statusTarget?.isActive ? 'Deactivate' : 'Activate'} Account`}
        message={`Are you sure you want to ${statusTarget?.isActive ? 'deactivate' : 'activate'} user "${statusTarget?.username}"? ${statusTarget?.isActive ? 'They will not be able to log in.' : 'They will regain access.'}`}
        confirmText={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={statusTarget?.isActive ? 'danger' : 'success'}
        onConfirm={handleStatusToggleConfirm}
        onCancel={() => setStatusTarget(null)}
      />

      {/* Confirm Unlock Modal */}
      <ConfirmModal
        isOpen={!!unlockTarget}
        title="Unlock User Account"
        message={`Reset failed login counter and remove lockout for user "${unlockTarget?.username}"?`}
        confirmText="Unlock Now"
        confirmVariant="warning"
        onConfirm={handleUnlockConfirm}
        onCancel={() => setUnlockTarget(null)}
      />
    </div>
  );
};

export default UserManagement;
