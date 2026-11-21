import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import AlertBanner from '../components/AlertBanner';

const Opportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [formData, setFormData] = useState({
    opportunityName: '',
    customerId: '',
    amount: '',
    stage: 'Qualification',
    probability: 20,
    expectedCloseDate: '',
    status: 'Active',
    assignedTo: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch opportunities
  const fetchOpportunities = async (currentPage = 1, currentStage = stageFilter, currentSearch = search) => {
    try {
      setLoading(true);
      const res = await api.get('/opportunities', {
        params: {
          page: currentPage,
          limit: 10,
          stage: currentStage || undefined,
          search: currentSearch || undefined
        }
      });
      if (res.data.success) {
        setOpportunities(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Failed to fetch opportunities.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch active customers for selector
  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers?limit=100&status=Active');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch customers list:', e);
    }
  };

  // Fetch users if Admin
  const fetchUsersList = async () => {
    if (user?.role === 'Admin') {
      try {
        const res = await api.get('/users');
        if (res.data.success) {
          setUsersList(res.data.data);
        }
      } catch (e) {
        console.warn('Failed to fetch users list:', e);
      }
    }
  };

  useEffect(() => {
    fetchOpportunities(1, stageFilter, search);
    fetchCustomersList();
    fetchUsersList();
  }, [stageFilter]);

  const validateForm = () => {
    const errors = {};

    if (!formData.opportunityName.trim()) {
      errors.opportunityName = 'Opportunity Name is required.';
    }

    if (!formData.customerId) {
      errors.customerId = 'Customer is required.';
    }

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.amount = 'Opportunity Amount must be greater than 0.';
    }

    const prob = parseInt(formData.probability, 10);
    if (isNaN(prob) || prob < 0 || prob > 100) {
      errors.probability = 'Probability must be between 0 and 100.';
    }

    if (!formData.expectedCloseDate) {
      errors.expectedCloseDate = 'Expected Close Date is required.';
    } else if (formData.status !== 'Closed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      if (formData.expectedCloseDate < todayStr) {
        errors.expectedCloseDate = 'Expected Close Date cannot be in the past.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingOpp(null);
    const today = new Date();
    today.setDate(today.getDate() + 14); // 2 weeks default
    const defaultDate = today.toISOString().split('T')[0];

    setFormData({
      opportunityName: '',
      customerId: customers.length > 0 ? customers[0].id : '',
      amount: '',
      stage: 'Qualification',
      probability: 20,
      expectedCloseDate: defaultDate,
      status: 'Active',
      assignedTo: user?.id || ''
    });
    setFieldErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (opp) => {
    setEditingOpp(opp);
    setFormData({
      opportunityName: opp.opportunityName || '',
      customerId: opp.customerId || '',
      amount: opp.amount || '',
      stage: opp.stage || 'Qualification',
      probability: opp.probability !== undefined ? opp.probability : 20,
      expectedCloseDate: opp.expectedCloseDate || '',
      status: opp.status || 'Active',
      assignedTo: opp.assignedTo || ''
    });
    setFieldErrors({});
    setIsFormModalOpen(true);
  };

  const handleStageChange = (newStage) => {
    let prob = formData.probability;
    let newStatus = formData.status;
    if (newStage === 'Qualification') prob = 20;
    else if (newStage === 'Proposal') prob = 50;
    else if (newStage === 'Negotiation') prob = 80;
    else if (newStage === 'Won') {
      prob = 100;
      newStatus = 'Closed';
    } else if (newStage === 'Lost') {
      prob = 0;
      newStatus = 'Closed';
    }
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: prob,
      status: newStatus
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (editingOpp) {
        await api.put(`/opportunities/${editingOpp.id}`, formData);
        setAlert({ type: 'success', message: `Opportunity "${formData.opportunityName}" updated.` });
      } else {
        await api.post('/opportunities', formData);
        setAlert({ type: 'success', message: `Opportunity "${formData.opportunityName}" created.` });
      }
      setIsFormModalOpen(false);
      fetchOpportunities(page, stageFilter, search);
    } catch (err) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const errors = {};
        err.fieldErrors.forEach((fe) => {
          errors[fe.field] = fe.message;
        });
        setFieldErrors(errors);
      } else {
        setAlert({ type: 'danger', message: err.cleanMessage || 'Operation failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/opportunities/${deleteTarget.id}`);
      setAlert({ type: 'success', message: `Opportunity "${deleteTarget.opportunityName}" deleted.` });
      setDeleteTarget(null);
      fetchOpportunities(page, stageFilter, search);
    } catch (err) {
      setAlert({ type: 'danger', message: err.cleanMessage || 'Delete failed.' });
    }
  };

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'Qualification':
        return 'bg-secondary';
      case 'Proposal':
        return 'bg-info text-dark';
      case 'Negotiation':
        return 'bg-warning text-dark';
      case 'Won':
        return 'bg-success';
      case 'Lost':
        return 'bg-danger';
      default:
        return 'bg-light text-dark border';
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amt || 0);
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">Deal Pipeline & Opportunities</h3>
          <p className="text-muted small mb-0">
            {user?.role === 'SalesExecutive'
              ? 'Tracking opportunities assigned to you'
              : 'Managing complete organizational sales pipeline'}
          </p>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-circle"></i>
          <span>New Opportunity</span>
        </button>
      </div>

      <AlertBanner alert={alert} onClose={() => setAlert(null)} />

      {/* Filter and Stage Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search opportunities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOpportunities(1, stageFilter, search)}
                />
              </div>
            </div>
            <div className="col-12 col-md-7 d-flex flex-wrap gap-1 justify-content-md-end">
              {['', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'].map((stg) => (
                <button
                  key={stg || 'all'}
                  type="button"
                  className={`btn btn-sm ${stageFilter === stg ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStageFilter(stg)}
                >
                  {stg || 'All Stages'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Opportunity Name</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Expected Close</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading opportunities...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No opportunities found matching your criteria.
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr key={opp.id}>
                    <td className="fw-semibold text-dark">{opp.opportunityName}</td>
                    <td>
                      <div>{opp.customer?.customerName || 'N/A'}</div>
                      <small className="text-muted">{opp.customer?.customerCode}</small>
                    </td>
                    <td className="fw-bold text-dark">{formatCurrency(opp.amount)}</td>
                    <td>
                      <span className={`badge ${getStageBadgeClass(opp.stage)}`}>
                        {opp.stage}
                      </span>
                    </td>
                    <td style={{ minWidth: '110px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${opp.probability >= 70 ? 'bg-success' : opp.probability >= 40 ? 'bg-primary' : 'bg-warning'}`}
                            role="progressbar"
                            style={{ width: `${opp.probability}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">{opp.probability}%</small>
                      </div>
                    </td>
                    <td><small className="text-muted">{opp.expectedCloseDate}</small></td>
                    <td>
                      <span className={`badge ${opp.status === 'Active' ? 'bg-light text-dark border' : 'bg-secondary'}`}>
                        {opp.status}
                      </span>
                    </td>
                    <td><small className="text-dark">{opp.assignee?.username || 'Unassigned'}</small></td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Edit Deal"
                          onClick={() => openEditModal(opp)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          title="Delete Deal"
                          onClick={() => setDeleteTarget(opp)}
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
            onPageChange={(p) => fetchOpportunities(p, stageFilter, search)}
          />
        </div>
      </div>

      {/* Create / Edit Opportunity Modal */}
      {isFormModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingOpp ? `Edit Deal: ${editingOpp.opportunityName}` : 'Create New Opportunity'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsFormModalOpen(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit} noValidate>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-7">
                      <label className="form-label small fw-semibold">Opportunity Name *</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.opportunityName ? 'is-invalid' : ''}`}
                        value={formData.opportunityName}
                        onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                        placeholder="e.g. Cloud Security Upgrade"
                      />
                      {fieldErrors.opportunityName && (
                        <div className="invalid-feedback">{fieldErrors.opportunityName}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-semibold">Customer Account *</label>
                      <select
                        className={`form-select ${fieldErrors.customerId ? 'is-invalid' : ''}`}
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      >
                        <option value="">Select a customer...</option>
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

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Deal Amount ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className={`form-control ${fieldErrors.amount ? 'is-invalid' : ''}`}
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="50000"
                      />
                      {fieldErrors.amount && <div className="invalid-feedback">{fieldErrors.amount}</div>}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Stage *</label>
                      <select
                        className="form-select"
                        value={formData.stage}
                        onChange={(e) => handleStageChange(e.target.value)}
                      >
                        <option value="Qualification">Qualification</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Won">Won (Closed)</option>
                        <option value="Lost">Lost (Closed)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Probability (0-100%) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className={`form-control ${fieldErrors.probability ? 'is-invalid' : ''}`}
                        value={formData.probability}
                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      />
                      {fieldErrors.probability && (
                        <div className="invalid-feedback">{fieldErrors.probability}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Expected Close Date *</label>
                      <input
                        type="date"
                        className={`form-control ${fieldErrors.expectedCloseDate ? 'is-invalid' : ''}`}
                        value={formData.expectedCloseDate}
                        onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                      />
                      {fieldErrors.expectedCloseDate && (
                        <div className="invalid-feedback">{fieldErrors.expectedCloseDate}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Deal Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {(user?.role === 'Admin' || user?.role === 'Manager') && (
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Assigned Sales Executive</label>
                        <select
                          className="form-select"
                          value={formData.assignedTo}
                          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        >
                          <option value={user.id}>Me ({user.username})</option>
                          {usersList.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.username} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : editingOpp ? 'Update Deal' : 'Create Deal'}
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
        title="Delete Opportunity"
        message={`Are you sure you want to permanently delete opportunity "${deleteTarget?.opportunityName}"? This action will be recorded in the audit log.`}
        confirmText="Delete Deal"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Opportunities;
